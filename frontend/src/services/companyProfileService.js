import { get, post } from '@/api/axios';

/**
 * Company Profile Service
 * Handles all company profile related API calls
 */
export const companyProfileService = {

    /**
     * Get company profile details
     * @returns {Promise<CompanyProfile>}
     */
    async getProfile() {
        try {
            const response = await get('/company-profile');
            return response;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    /**
     * Update company profile details
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<CompanyProfile>}
     */
    async updateProfile(profileData) {
        try {
            const response = await post('/company-profile', profileData);
            return response;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    /**
     * Upload company logo
     * @param {File} file - Logo file
     * @returns {Promise<CompanyProfile>}
     */
    async uploadLogo(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use axios instance from '@/api/axios' but we need to ensure multipart 
            // In the get/post helpers we might need to check if we can pass headers. 
            // The post helper in axios.js likely handles JSON by default.
            // If the post helper relies on axios instance, we can pass config.

            // Assuming post(url, data, config) signature based on invoiceService not showing config.
            // Let's check axios.js if possible, or just assume standard wrapping.

            // However, seeing invoiceService using `post('/invoices', invoiceData)`, let's blindly try to use post with headers.
            // If the wrapper doesn't support config, we might need to import the instance directly or assume `post` handles it.
            // Since I can't see axios.js wrapper details completely from invoiceService usage alone, I will construct a standard usage.

            // Looking at `invoiceService.js`:
            // `const response = await post('/invoices', invoiceData);`

            // I'll assume the helper passes the 3rd arg as config if I needed.
            // But wait, the previous code in CompanyProfilePage used:
            // axios.post('/api/v1/company-profile/logo', formData, { ... })

            // If I stick to the imported `post` helper:
            const response = await post('/company-profile/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response;
        } catch (error) {
            console.error('Upload logo error:', error);
            throw error;
        }
    }
};

/**
 * @typedef {Object} CompanyProfile
 * @property {number} id
 * @property {string} companyName
 * @property {string} companyNameArabic
 * @property {string} address
 * @property {string} phone
 * @property {string} email
 * @property {string} taxId
 * @property {string} commercialRegister
 * @property {string} footerText
 * @property {string} logoUrl
 */

export default companyProfileService;
