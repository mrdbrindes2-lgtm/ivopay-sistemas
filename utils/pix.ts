// utils/pix.ts

import { PixConfig } from '../types';

const formatValue = (id: string, value: string): string => {
    const size = value.length.toString().padStart(2, '0');
    return `${id}${size}${value}`;
};

// Simple CRC16-CCITT-FALSE implementation (no external libraries)
const crc16 = (data: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) & 0xFFFF) ^ 0x1021;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Generates a PIX payload string (BRCode) for a static QR code.
 * @param {PixConfig} pixConfig - The PIX configuration object.
 * @param {number} [amount] - The transaction amount. If omitted, the QR code will have an open value.
 * @param {string} merchantName - The name of the merchant.
 * @param {string} merchantCity - The city of the merchant.
 * @returns {string} The generated PIX payload string.
 */
export const generatePixPayload = (pixConfig: PixConfig, amount: number | undefined, merchantName: string, merchantCity: string): string => {
    if (!pixConfig || !pixConfig.key) {
        throw new Error("PIX key is not configured.");
    }
    
    // Sanitize and format merchant name and city
    const formattedMerchantName = merchantName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 25);
        
    const formattedMerchantCity = merchantCity
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 15);

    const txid = (pixConfig.identifier || '***').substring(0, 25);

    const payloadParts = [
        formatValue('00', '01'), // Payload Format Indicator
        formatValue('26', // Merchant Account Information
            formatValue('00', 'br.gov.bcb.pix') +
            formatValue('01', pixConfig.key)
        ),
        formatValue('52', '0000'), // Merchant Category Code
        formatValue('53', '986'), // Transaction Currency (BRL)
        ...(amount ? [formatValue('54', amount.toFixed(2))] : []), // Transaction Amount (optional)
        formatValue('58', 'BR'), // Country Code
        formatValue('59', formattedMerchantName), // Merchant Name
        formatValue('60', formattedMerchantCity), // Merchant City
        formatValue('62', formatValue('05', txid)) // Additional Data (txid)
    ];

    const payloadWithoutCrc = payloadParts.join('');
    
    const payloadWithCrcId = payloadWithoutCrc + '6304';
    
    const crc = crc16(payloadWithCrcId);

    return payloadWithCrcId + crc;
};