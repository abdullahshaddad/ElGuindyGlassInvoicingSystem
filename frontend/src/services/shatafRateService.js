// src/services/shatafRateService.js

import { get, post, put, del } from '@/api/axios';

/**
 * Shataf Rate Service
 * Handles all shataf rate-related API calls for the new enhanced system
 */
export const shatafRateService = {
    /**
     * Get all shataf types with metadata
     * @returns {Promise<Array>} List of shataf types with their properties
     */
    async getAllShatafTypes() {
        try {
            const response = await get('/shataf-rates/types');
            return response;
        } catch (error) {
            console.error('Get shataf types error:', error);
            throw error;
        }
    },

    /**
     * Get all active shataf rates
     * @returns {Promise<Array>} List of active shataf rates
     */
    async getAllActiveRates() {
        try {
            const response = await get('/shataf-rates');
            return response;
        } catch (error) {
            console.error('Get all shataf rates error:', error);
            throw error;
        }
    },

    /**
     * Get rates by shataf type
     * @param {string} shatafType - The shataf type (KHARAZAN, SHAMBORLEH, etc.)
     * @returns {Promise<Array>} List of rates for the specified type
     */
    async getRatesByType(shatafType) {
        try {
            const response = await get(`/shataf-rates/type/${shatafType}`);
            return response;
        } catch (error) {
            console.error(`Get rates for ${shatafType} error:`, error);
            throw error;
        }
    },

    /**
     * Get rate for specific shataf type and thickness
     * @param {string} shatafType - The shataf type
     * @param {number} thickness - Glass thickness in mm
     * @returns {Promise<number>} Rate per meter
     */
    async getRateForThickness(shatafType, thickness) {
        try {
            const response = await get('/shataf-rates/rate', {
                params: { shatafType, thickness }
            });
            return response;
        } catch (error) {
            console.error(`Get rate for ${shatafType} at ${thickness}mm error:`, error);
            return 10.0; // Default fallback
        }
    },

    /**
     * Initialize default shataf rates
     * @returns {Promise<Array>} Created default rates
     */
    async initializeDefaultRates() {
        try {
            const response = await post('/shataf-rates/initialize-defaults');
            return response;
        } catch (error) {
            console.error('Initialize default rates error:', error);
            throw error;
        }
    },

    /**
     * Create a new shataf rate
     * @param {Object} rateData - Rate data
     * @param {string} rateData.shatafType - Shataf type
     * @param {number} rateData.minThickness - Minimum thickness
     * @param {number} rateData.maxThickness - Maximum thickness
     * @param {number} rateData.ratePerMeter - Rate per meter
     * @returns {Promise<Object>} Created rate
     */
    async createRate(rateData) {
        try {
            const response = await post('/shataf-rates', rateData);
            return response;
        } catch (error) {
            console.error('Create shataf rate error:', error);
            throw error;
        }
    },

    /**
     * Update an existing shataf rate
     * @param {number} id - Rate ID
     * @param {Object} rateData - Updated rate data
     * @returns {Promise<Object>} Updated rate
     */
    async updateRate(id, rateData) {
        try {
            const response = await put(`/shataf-rates/${id}`, rateData);
            return response;
        } catch (error) {
            console.error(`Update shataf rate ${id} error:`, error);
            throw error;
        }
    },

    /**
     * Delete a shataf rate
     * @param {number} id - Rate ID
     * @returns {Promise<Object>} Success message
     */
    async deleteRate(id) {
        try {
            const response = await del(`/shataf-rates/${id}`);
            return response;
        } catch (error) {
            console.error(`Delete shataf rate ${id} error:`, error);
            throw error;
        }
    },

    /**
     * Bulk update rates for a shataf type
     * @param {string} shatafType - Shataf type
     * @param {Array} rates - Array of rate mappings
     * @returns {Promise<Array>} Updated rates
     */
    async bulkUpdateRates(shatafType, rates) {
        try {
            const response = await post('/shataf-rates/bulk-update', {
                shatafType,
                rates
            });
            return response;
        } catch (error) {
            console.error('Bulk update shataf rates error:', error);
            throw error;
        }
    },

    /**
     * Calculate shataf price preview
     * Helper method that uses rate service and farma calculations
     * @param {Object} params - Calculation parameters
     * @returns {Promise<Object>} Calculated price breakdown
     */
    async calculateShatafPrice(params) {
        const {
            shatafType,
            farmaType,
            thickness,
            width,
            height,
            diameter,
            manualPrice
        } = params;

        try {
            // Import farma utils dynamically to avoid circular dependencies
            const { calculateShatafMeters } = await import('@/utils/farmaUtils');
            const { requiresManualPrice, isAreaBased } = await import('@/constants/shatafTypes');

            // Handle manual price types
            if (requiresManualPrice(shatafType)) {
                return {
                    shatafType,
                    thickness,
                    manualPrice: manualPrice || 0,
                    totalPrice: manualPrice || 0,
                    isManual: true
                };
            }

            // Convert dimensions to meters
            const widthM = width / 100;
            const heightM = height / 100;
            const area = widthM * heightM;

            // Handle area-based types (SANDING)
            if (isAreaBased(shatafType)) {
                const rate = await this.getRateForThickness(shatafType, thickness);
                const totalPrice = area * rate;

                return {
                    shatafType,
                    thickness,
                    area,
                    ratePerMeter: rate,
                    totalPrice,
                    calculation: `${area.toFixed(2)} م² × ${rate} ج.م/م² = ${totalPrice.toFixed(2)} ج.م`
                };
            }

            // Handle formula-based types
            const shatafMeters = calculateShatafMeters(farmaType, widthM, heightM, diameter);
            const rate = await this.getRateForThickness(shatafType, thickness);
            const totalPrice = shatafMeters * rate;

            return {
                shatafType,
                farmaType,
                thickness,
                shatafMeters,
                ratePerMeter: rate,
                totalPrice,
                calculation: `${shatafMeters.toFixed(2)} م × ${rate} ج.م/م = ${totalPrice.toFixed(2)} ج.م`
            };

        } catch (error) {
            console.error('Calculate shataf price error:', error);
            throw error;
        }
    }
};

export default shatafRateService;