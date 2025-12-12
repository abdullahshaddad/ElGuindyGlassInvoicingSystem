import { get, post, put, del } from '@/api/axios';

/**
 * Operation Price Service
 * Handles all operation price management operations
 */
export const operationPriceService = {
    /**
     * Get all operation prices
     * @param {Object} params - Query parameters
     * @param {boolean} params.activeOnly - Filter active only
     * @param {string} params.type - Filter by operation type (SHATAF, FARMA, LASER)
     * @returns {Promise<OperationPrice[]>}
     */
    async getAllOperationPrices(params = {}) {
        try {
            console.log('🔍 Fetching operation prices...', params);
            const queryParams = new URLSearchParams();

            if (params.activeOnly !== undefined) {
                queryParams.append('activeOnly', params.activeOnly);
            }
            if (params.type) {
                queryParams.append('type', params.type);
            }

            const url = `/operation-prices${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await get(url);

            if (!response || !Array.isArray(response)) {
                console.warn('⚠️ Operation prices API returned invalid data, returning empty array');
                return [];
            }

            console.log(`✅ Successfully loaded ${response.length} operation prices`);
            return response;

        } catch (error) {
            console.error('❌ Get operation prices error:', error);
            if (error.response) {
                console.error('Response error:', error.response.status, error.response.data);
            }
            return [];
        }
    },

    /**
     * Get operation price by ID
     * @param {number} id - Operation price ID
     * @returns {Promise<OperationPrice>}
     */
    async getOperationPriceById(id) {
        try {
            console.log(`🔍 Fetching operation price with ID: ${id}`);
            const response = await get(`/operation-prices/${id}`);
            console.log('✅ Successfully loaded operation price:', response);
            return response;
        } catch (error) {
            console.error('❌ Get operation price by ID error:', error);
            throw error;
        }
    },

    /**
     * Get operation price by type and subtype
     * @param {string} operationType - Operation type (SHATAF, FARMA, LASER)
     * @param {string} subtype - Subtype (e.g., NORMAL, DEEP, ENGRAVE)
     * @returns {Promise<OperationPrice>}
     */
    async getOperationPriceByTypeAndSubtype(operationType, subtype) {
        try {
            console.log(`🔍 Fetching operation price for ${operationType}/${subtype}`);
            const response = await get(`/operation-prices/type/${operationType}/subtype/${subtype}`);
            console.log('✅ Successfully loaded operation price:', response);
            return response;
        } catch (error) {
            console.error('❌ Get operation price by type/subtype error:', error);
            throw error;
        }
    },

    /**
     * Create new operation price
     * @param {Object} operationPriceData - Operation price data
     * @returns {Promise<OperationPrice>}
     */
    async createOperationPrice(operationPriceData) {
        try {
            console.log('📝 Creating operation price:', operationPriceData);

            // Ensure required fields are present
            if (!operationPriceData.operationType) {
                throw new Error('Operation type is required');
            }
            if (!operationPriceData.subtype) {
                throw new Error('Subtype is required');
            }
            if (!operationPriceData.arabicName) {
                throw new Error('Arabic name is required');
            }
            if (operationPriceData.basePrice === undefined || operationPriceData.basePrice === null) {
                throw new Error('Base price is required');
            }

            const response = await post('/operation-prices', operationPriceData);
            console.log('✅ Successfully created operation price:', response);
            return response;
        } catch (error) {
            console.error('❌ Create operation price error:', error);
            throw error;
        }
    },

    /**
     * Update operation price
     * @param {number} id - Operation price ID
     * @param {Object} operationPriceData - Updated operation price data
     * @returns {Promise<OperationPrice>}
     */
    async updateOperationPrice(id, operationPriceData) {
        try {
            console.log(`📝 Updating operation price ${id}:`, operationPriceData);
            const response = await put(`/operation-prices/${id}`, operationPriceData);
            console.log('✅ Successfully updated operation price:', response);
            return response;
        } catch (error) {
            console.error('❌ Update operation price error:', error);
            throw error;
        }
    },

    /**
     * Toggle operation price active status
     * @param {number} id - Operation price ID
     * @returns {Promise<OperationPrice>}
     */
    async toggleActiveStatus(id) {
        try {
            console.log(`🔄 Toggling active status for operation price ${id}`);
            const response = await post(`/operation-prices/${id}/toggle`, {});
            console.log('✅ Successfully toggled operation price status:', response);
            return response;
        } catch (error) {
            console.error('❌ Toggle operation price status error:', error);
            throw error;
        }
    },

    /**
     * Delete operation price
     * @param {number} id - Operation price ID
     * @returns {Promise<void>}
     */
    async deleteOperationPrice(id) {
        try {
            console.log(`🗑️ Deleting operation price ${id}`);
            await del(`/operation-prices/${id}`);
            console.log('✅ Successfully deleted operation price');
        } catch (error) {
            console.error('❌ Delete operation price error:', error);
            throw error;
        }
    },

    /**
     * Initialize default operation prices
     * @returns {Promise<string>}
     */
    async initializeDefaultPrices() {
        try {
            console.log('🔧 Initializing default operation prices');
            const response = await post('/operation-prices/initialize', {});
            console.log('✅ Default prices initialized:', response);
            return response;
        } catch (error) {
            console.error('❌ Initialize default prices error:', error);
            throw error;
        }
    }
};
