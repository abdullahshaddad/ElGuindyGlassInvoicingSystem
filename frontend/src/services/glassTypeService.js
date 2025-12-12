import { get, post, put, del } from '@/api/axios';

/**
 * Glass Type Service - Enhanced with comprehensive error handling
 * Handles all glass type management operations
 */
export const glassTypeService = {
    /**
     * Get all glass types with enhanced error handling
     * @returns {Promise<GlassType[]>} Array of glass types (never undefined)
     */
    async getAllGlassTypes() {
        try {
            console.log('🔍 Fetching all glass types...');
            const response = await get('/glass-types');

            // Defensive checks for undefined/null response
            if (!response) {
                console.warn('⚠️ Glass types API returned undefined/null, returning empty array');
                return [];
            }

            // Check if response is an array
            if (!Array.isArray(response)) {
                console.warn('⚠️ Glass types API returned non-array:', {
                    type: typeof response,
                    value: response
                });
                return [];
            }

            console.log(`✅ Successfully loaded ${response.length} glass types`);

            // Additional validation: check if glass types have required fields
            const validGlassTypes = response.filter(type => {
                const isValid = type.id && type.name && type.thickness !== undefined;
                if (!isValid) {
                    console.warn('⚠️ Invalid glass type found:', type);
                }
                return isValid;
            });

            if (validGlassTypes.length !== response.length) {
                console.warn(`⚠️ Filtered out ${response.length - validGlassTypes.length} invalid glass types`);
            }

            return validGlassTypes;

        } catch (error) {
            console.error('❌ Get all glass types error:', error);

            // Detailed error logging for debugging
            if (error.response) {
                // Server responded with error status
                console.error('📡 Response error:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });

                // Specific error messages
                if (error.response.status === 404) {
                    console.error('🔍 Endpoint not found - Check API URL configuration');
                } else if (error.response.status === 401 || error.response.status === 403) {
                    console.error('🔐 Authentication/Authorization error');
                } else if (error.response.status === 500) {
                    console.error('💥 Server error - Check backend logs');
                }
            } else if (error.request) {
                // Request was made but no response received
                console.error('📡 Request error (no response received):', {
                    request: error.request,
                    message: 'Backend server may be down or unreachable'
                });
            } else {
                // Error in request setup
                console.error('⚙️ Setup error:', error.message);
            }

            // Return empty array instead of throwing
            // This prevents UI components from breaking
            return [];
        }
    },

    /**
     * Get active glass types only
     * @returns {Promise<GlassType[]>}
     */
    async getActiveGlassTypes() {
        try {
            console.log('🔍 Fetching active glass types...');
            const response = await get('/glass-types/active');

            if (!Array.isArray(response)) {
                console.warn('⚠️ Active glass types returned non-array');
                return [];
            }

            console.log(`✅ Loaded ${response.length} active glass types`);
            return response;

        } catch (error) {
            console.error('❌ Get active glass types error:', error);

            // Fallback: try to get all and filter active ones
            console.log('🔄 Attempting fallback: filtering from all glass types');
            try {
                const allTypes = await this.getAllGlassTypes();
                const activeTypes = allTypes.filter(type => type.isActive !== false);
                console.log(`✅ Fallback successful: ${activeTypes.length} active types`);
                return activeTypes;
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                return [];
            }
        }
    },

    /**
     * Get glass type by ID
     * @param {string|number} id - Glass type ID
     * @returns {Promise<GlassType|null>}
     */
    async getGlassType(id) {
        try {
            console.log(`🔍 Fetching glass type ID: ${id}`);
            const response = await get(`/glass-types/${id}`);

            if (!response) {
                console.warn(`⚠️ Glass type ${id} not found`);
                return null;
            }

            console.log(`✅ Glass type ${id} loaded:`, response.name);
            return response;

        } catch (error) {
            console.error(`❌ Get glass type ${id} error:`, error);
            return null;
        }
    },

    /**
     * Create new glass type
     * @param {Object} glassTypeData - Glass type data
     * @param {string} glassTypeData.name - Glass type name
     * @param {number} glassTypeData.thickness - Thickness in mm
     * @param {string} [glassTypeData.color] - Glass color (optional)
     * @param {number} glassTypeData.pricePerMeter - Price per square meter
     * @returns {Promise<GlassType>}
     */
    async createGlassType(glassTypeData) {
        try {
            console.log('Sending data to backend:', glassTypeData);
            console.log('➕ Creating new glass type:', glassTypeData.name);

            // Validate required fields before sending (FIXED: pricePerMeter not pricePerUnit)
            if (!glassTypeData.name || !glassTypeData.thickness || !glassTypeData.pricePerMeter) {
                throw new Error('Missing required fields: name, thickness, or pricePerMeter');
            }

            const response = await post('/glass-types', glassTypeData);
            console.log(`✅ Glass type created: ${response.name} (ID: ${response.id})`);
            return response;

        } catch (error) {
            console.error('❌ Create glass type error:', error);
            throw error;
        }
    },

    /**
     * Update glass type
     * @param {string|number} id - Glass type ID
     * @param {Object} glassTypeData - Updated glass type data
     * @returns {Promise<GlassType>}
     */
    async updateGlassType(id, glassTypeData) {
        try {
            console.log(`📝 Updating glass type ID: ${id}`);
            const response = await put(`/glass-types/${id}`, glassTypeData);
            console.log(`✅ Glass type ${id} updated`);
            return response;

        } catch (error) {
            console.error(`❌ Update glass type ${id} error:`, error);
            throw error;
        }
    },

    /**
     * Delete glass type
     * @param {string|number} id - Glass type ID
     * @returns {Promise<void>}
     */
    async deleteGlassType(id) {
        try {
            console.log(`🗑️ Deleting glass type ID: ${id}`);
            await del(`/glass-types/${id}`);
            console.log(`✅ Glass type ${id} deleted`);

        } catch (error) {
            console.error(`❌ Delete glass type ${id} error:`, error);
            throw error;
        }
    },

    /**
     * Get glass types by thickness
     * @param {number} thickness - Glass thickness
     * @returns {Promise<GlassType[]>}
     */
    async getByThickness(thickness) {
        try {
            console.log(`🔍 Fetching glass types with thickness: ${thickness}mm`);
            const params = new URLSearchParams({ thickness: thickness.toString() });
            const response = await get(`/glass-types/by-thickness?${params.toString()}`);

            if (!Array.isArray(response)) {
                console.warn('⚠️ By thickness returned non-array');
                return [];
            }

            console.log(`✅ Found ${response.length} glass types with ${thickness}mm thickness`);
            return response;

        } catch (error) {
            console.error(`❌ Get by thickness ${thickness} error:`, error);
            return [];
        }
    },

    /**
     * Test API connectivity
     * @returns {Promise<boolean>} True if API is accessible
     */
    async testConnection() {
        try {
            console.log('🔌 Testing glass types API connection...');
            const response = await get('/glass-types');
            console.log('✅ API connection successful');
            return true;
        } catch (error) {
            console.error('❌ API connection failed:', error);
            return false;
        }
    },

    /**
     * Get API health status
     * @returns {Promise<Object>} Health status information
     */
    async getHealthStatus() {
        try {
            const response = await get('/glass-types');
            return {
                status: 'healthy',
                count: Array.isArray(response) ? response.length : 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
};

export default glassTypeService;