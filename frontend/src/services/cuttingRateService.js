import { get, post, put, del } from '@/api/axios';

/**
 * Cutting Rate Service
 * Handles all cutting rate-related API calls
 */
export const cuttingRateService = {
    /**
     * Get all active cutting rates
     * @returns {Promise<Array>} List of cutting rates
     */
    async getAllRates() {
        try {
            const response = await get('/cutting-rates');
            return response;
        } catch (error) {
            console.error('Get all rates error:', error);
            throw error;
        }
    },

    /**
     * Get cutting rates by type (SHATF or LASER)
     * @param {string} cuttingType - The cutting type (SHATF, LASER)
     * @returns {Promise<Array>} List of cutting rates for the specified type
     */
    async getRatesByType(cuttingType) {
        try {
            const response = await get(`/cutting-rates/type/${cuttingType}`);
            return response;
        } catch (error) {
            console.error(`Get ${cuttingType} rates error:`, error);
            throw error;
        }
    },

    /**
     * Create a new cutting rate
     * @param {Object} cuttingRate - The cutting rate data
     * @param {string} cuttingRate.cuttingType - SHATF or LASER
     * @param {number} cuttingRate.thickness - Glass thickness
     * @param {number} cuttingRate.pricePerMeter - Price per meter
     * @param {boolean} cuttingRate.isActive - Whether the rate is active
     * @returns {Promise<Object>} Created cutting rate
     */
    async createRate(cuttingRate) {
        try {
            const response = await post('/cutting-rates', cuttingRate);
            return response;
        } catch (error) {
            console.error('Create cutting rate error:', error);
            throw error;
        }
    },

    /**
     * Update an existing cutting rate
     * @param {number} id - The cutting rate ID
     * @param {Object} cuttingRate - Updated cutting rate data
     * @returns {Promise<Object>} Updated cutting rate
     */
    async updateRate(id, cuttingRate) {
        try {
            const response = await put(`/cutting-rates/${id}`, cuttingRate);
            return response;
        } catch (error) {
            console.error('Update cutting rate error:', error);
            throw error;
        }
    },

    /**
     * Delete (deactivate) a cutting rate
     * @param {number} id - The cutting rate ID
     * @returns {Promise<void>}
     */
    async deleteRate(id) {
        try {
            await del(`/cutting-rates/${id}`);
        } catch (error) {
            console.error('Delete cutting rate error:', error);
            throw error;
        }
    },

    /**
     * Initialize default cutting rates
     * @returns {Promise<Array>} List of default cutting rates
     */
    async initializeDefaultRates() {
        try {
            const response = await post('/cutting-rates/initialize-default');
            return response;
        } catch (error) {
            console.error('Initialize default rates error:', error);
            throw error;
        }
    },

    /**
     * Calculate cutting rate for specific type and thickness
     * @param {string} cuttingType - SHATF or LASER
     * @param {number} thickness - Glass thickness
     * @returns {Promise<number>} Calculated rate
     */
    async calculateRate(cuttingType, thickness) {
        try {
            const response = await get('/cutting-rates/calculate', {
                params: { cuttingType, thickness }
            });
            return response;
        } catch (error) {
            console.error('Calculate cutting rate error:', error);
            throw error;
        }
    },

    /**
     * Get cutting rates formatted for frontend use
     * @returns {Promise<Object>} Formatted cutting rates with defaults
     */
    async getFormattedRates() {
        try {
            const rates = await this.getAllRates();

            // Group rates by cutting type for easier frontend use
            const shatfRates = rates.filter(rate => rate.cuttingType === 'SHATF');
            const laserRates = rates.filter(rate => rate.cuttingType === 'LASER');

            return {
                shatfRates,
                laserRates,
                defaultShatfRate: shatfRates.find(rate => rate.isDefault)?.pricePerMeter || 25,
                defaultLaserRate: laserRates.find(rate => rate.isDefault)?.pricePerMeter || 50,
                allRates: rates
            };
        } catch (error) {
            console.error('Get formatted rates error:', error);
            throw error;
        }
    },

    /**
     * Get rate for specific cutting type and thickness (with fallback to default)
     * @param {string} cuttingType - SHATF or LASER
     * @param {number} thickness - Glass thickness (optional)
     * @returns {Promise<number>} Rate per meter
     */
    async getRateForGlass(cuttingType, thickness = null) {
        try {
            if (thickness) {
                return await this.calculateRate(cuttingType, thickness);
            } else {
                const rates = await this.getRatesByType(cuttingType);
                const defaultRate = rates.find(rate => rate.isDefault);
                return defaultRate ? defaultRate.pricePerMeter : (cuttingType === 'LASER' ? 50 : 25);
            }
        } catch (error) {
            console.error('Get rate for glass error:', error);
            // Return fallback rates
            return cuttingType === 'LASER' ? 50 : 25;
        }
    },

    /**
     * Update default rates for both cutting types
     * @param {Object} rates - Object containing default rates
     * @param {number} rates.shatfRate - Default SHATF rate per meter
     * @param {number} rates.laserRate - Default LASER rate per meter
     * @returns {Promise<Array>} Updated cutting rates
     */
    async updateDefaultRates(rates) {
        try {
            const currentRates = await this.getAllRates();
            const updatePromises = [];

            // Update SHATF default rate
            const shatfDefault = currentRates.find(rate =>
                rate.cuttingType === 'SHATF' && rate.isDefault
            );
            if (shatfDefault) {
                updatePromises.push(
                    this.updateRate(shatfDefault.id, {
                        ...shatfDefault,
                        pricePerMeter: rates.shatfRate
                    })
                );
            } else {
                updatePromises.push(
                    this.createRate({
                        cuttingType: 'SHATF',
                        pricePerMeter: rates.shatfRate,
                        isDefault: true,
                        isActive: true
                    })
                );
            }

            // Update LASER default rate
            const laserDefault = currentRates.find(rate =>
                rate.cuttingType === 'LASER' && rate.isDefault
            );
            if (laserDefault) {
                updatePromises.push(
                    this.updateRate(laserDefault.id, {
                        ...laserDefault,
                        pricePerMeter: rates.laserRate
                    })
                );
            } else {
                updatePromises.push(
                    this.createRate({
                        cuttingType: 'LASER',
                        pricePerMeter: rates.laserRate,
                        isDefault: true,
                        isActive: true
                    })
                );
            }

            const results = await Promise.all(updatePromises);
            return results;
        } catch (error) {
            console.error('Update default rates error:', error);
            throw error;
        }
    },

    /**
     * Update Shataf rates by thickness ranges
     * @param {Object} thicknessRates - Object with thickness ranges as keys and rates as values
     * @returns {Promise<Array>} Updated cutting rates
     */
    async updateShatafRatesByThickness(thicknessRates) {
        try {
            const updatePromises = [];

            // Map thickness ranges to actual thickness bounds (matching backend structure)
            const thicknessMapping = {
                '0-3': { min: 0.0, max: 3.0 },
                '3.1-4': { min: 3.1, max: 4.0 },
                '4.1-5': { min: 4.1, max: 5.0 },
                '5.1-6': { min: 5.1, max: 6.0 },
                '6.1-8': { min: 6.1, max: 8.0 },
                '8.1-10': { min: 8.1, max: 10.0 },
                '10.1-12': { min: 10.1, max: 12.0 },
                '12+': { min: 12.1, max: 50.0 } // Backend uses 50.0 as max for highest range
            };

            // Get current Shataf rates
            const currentRates = await this.getRatesByType('SHATF');

            for (const [range, rate] of Object.entries(thicknessRates)) {
                const thickness = thicknessMapping[range];
                if (!thickness) continue;

                // Find existing rate for this thickness range (more flexible matching)
                const existingRate = currentRates.find(r =>
                    Math.abs(r.minThickness - thickness.min) < 0.01 &&
                    Math.abs(r.maxThickness - thickness.max) < 0.01
                );

                if (existingRate) {
                    // Update existing rate using backend field names
                    updatePromises.push(
                        this.updateRate(existingRate.id, {
                            id: existingRate.id,
                            cuttingType: existingRate.cuttingType,
                            minThickness: thickness.min,
                            maxThickness: thickness.max,
                            ratePerMeter: rate, // Backend uses ratePerMeter
                            active: true
                        })
                    );
                } else {
                    // Create new rate using backend field names
                    updatePromises.push(
                        this.createRate({
                            cuttingType: 'SHATF',
                            minThickness: thickness.min,
                            maxThickness: thickness.max,
                            ratePerMeter: rate, // Backend uses ratePerMeter
                            active: true
                        })
                    );
                }
            }

            const results = await Promise.all(updatePromises);
            return results;
        } catch (error) {
            console.error('Update Shataf rates by thickness error:', error);
            throw error;
        }
    },

    /**
     * Initialize default Shataf rates (calls backend initialization)
     * @returns {Promise<Array>} Default cutting rates
     */
    async initializeShatafDefaults() {
        try {
            const response = await post('/cutting-rates/initialize-default');
            return response;
        } catch (error) {
            console.error('Initialize Shataf defaults error:', error);
            throw error;
        }
    },

    /**
     * Get rate for specific thickness (matches backend logic)
     * @param {string} cuttingType - SHATF or LASER
     * @param {number} thickness - Glass thickness in mm
     * @returns {Promise<number>} Rate per meter
     */
    async getRateForThickness(cuttingType, thickness) {
        try {
            const response = await get('/cutting-rates/rate-for-thickness', {
                params: { cuttingType, thickness }
            });
            return response || 10.0; // Backend default fallback
        } catch (error) {
            console.error('Get rate for thickness error:', error);
            return 10.0; // Backend default fallback
        }
    }
};