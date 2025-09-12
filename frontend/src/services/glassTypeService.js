import { get, post, put, del } from '@/api/axios';

/**
 * Glass Type Service
 * Handles all glass type management (Admin/Owner only)
 */
export const glassTypeService = {
    /**
     * Get all glass types
     * @returns {Promise<GlassType[]>}
     */
    async getAllGlassTypes() {
        try {
            const response = await get('/glass-types');
            return response;
        } catch (error) {
            console.error('Get all glass types error:', error);
            throw error;
        }
    },

    /**
     * Get active glass types only
     * @returns {Promise<GlassType[]>}
     */
    async getActiveGlassTypes() {
        try {
            const response = await get('/glass-types/active');
            return response;
        } catch (error) {
            console.error('Get active glass types error:', error);
            throw error;
        }
    },

    /**
     * Get glass type by ID
     * @param {string|number} id - Glass type ID
     * @returns {Promise<GlassType>}
     */
    async getGlassType(id) {
        try {
            const response = await get(`/glass-types/${id}`);
            return response;
        } catch (error) {
            console.error('Get glass type error:', error);
            throw error;
        }
    },

    /**
     * Create new glass type
     * @param {Object} glassTypeData - Glass type data
     * @param {string} glassTypeData.name - Glass type name
     * @param {string} glassTypeData.nameArabic - Arabic name
     * @param {number} glassTypeData.thickness - Glass thickness
     * @param {string} [glassTypeData.color] - Glass color
     * @param {string} [glassTypeData.description] - Description
     * @param {number} glassTypeData.pricePerSquareMeter - Price per square meter
     * @param {boolean} [glassTypeData.isActive=true] - Active status
     * @returns {Promise<GlassType>}
     */
    async createGlassType(glassTypeData) {
        try {
            const response = await post('/glass-types', glassTypeData);
            return response;
        } catch (error) {
            console.error('Create glass type error:', error);
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
            const response = await put(`/glass-types/${id}`, glassTypeData);
            return response;
        } catch (error) {
            console.error('Update glass type error:', error);
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
            await del(`/glass-types/${id}`);
        } catch (error) {
            console.error('Delete glass type error:', error);
            throw error;
        }
    },

    /**
     * Deactivate glass type (soft delete)
     * @param {string|number} id - Glass type ID
     * @returns {Promise<GlassType>}
     */
    async deactivateGlassType(id) {
        try {
            const response = await put(`/glass-types/${id}/deactivate`);
            return response;
        } catch (error) {
            console.error('Deactivate glass type error:', error);
            throw error;
        }
    },

    /**
     * Activate glass type
     * @param {string|number} id - Glass type ID
     * @returns {Promise<GlassType>}
     */
    async activateGlassType(id) {
        try {
            const response = await put(`/glass-types/${id}/activate`);
            return response;
        } catch (error) {
            console.error('Activate glass type error:', error);
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
            const params = new URLSearchParams({ thickness: thickness.toString() });
            const response = await get(`/glass-types/by-thickness?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Get by thickness error:', error);
            throw error;
        }
    },

    /**
     * Search glass types
     * @param {string} query - Search query
     * @returns {Promise<GlassType[]>}
     */
    async searchGlassTypes(query) {
        try {
            const params = new URLSearchParams({ q: query });
            const response = await get(`/glass-types/search?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Search glass types error:', error);
            throw error;
        }
    },

    /**
     * Get glass type usage statistics
     * @param {string|number} id - Glass type ID
     * @param {Object} params - Query parameters
     * @param {string} [params.startDate] - Start date
     * @param {string} [params.endDate] - End date
     * @returns {Promise<GlassTypeStats>}
     */
    async getUsageStats(id, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await get(`/glass-types/${id}/stats?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Get usage stats error:', error);
            throw error;
        }
    },

    /**
     * Bulk update glass type prices
     * @param {Object[]} updates - Array of price updates
     * @param {string|number} updates[].id - Glass type ID
     * @param {number} updates[].pricePerSquareMeter - New price
     * @returns {Promise<GlassType[]>}
     */
    async bulkUpdatePrices(updates) {
        try {
            const response = await put('/glass-types/bulk-update-prices', { updates });
            return response;
        } catch (error) {
            console.error('Bulk update prices error:', error);
            throw error;
        }
    },

    /**
     * Import glass types from file
     * @param {File} file - CSV or Excel file
     * @returns {Promise<ImportResult>}
     */
    async importGlassTypes(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await post('/glass-types/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response;
        } catch (error) {
            console.error('Import glass types error:', error);
            throw error;
        }
    },

    /**
     * Export glass types to CSV
     * @param {Object} params - Export parameters
     * @returns {Promise<Blob>}
     */
    async exportGlassTypes(params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await get(`/glass-types/export?${queryParams.toString()}`, {
                responseType: 'blob',
            });

            return response;
        } catch (error) {
            console.error('Export glass types error:', error);
            throw error;
        }
    },
};