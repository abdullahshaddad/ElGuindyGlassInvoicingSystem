package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.repositories.CompanyProfileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@Service
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository repository;
    private final com.example.backend.repositories.InvoiceRepository invoiceRepository;

    public CompanyProfileService(CompanyProfileRepository repository,
                                  com.example.backend.repositories.InvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Get profile for frontend display (with base64 data URL for logo)
     */
    public CompanyProfile getProfile() {
        CompanyProfile profile = getProfileInternal();

        // If logo exists, return with data URL for direct display
        if (profile.getLogoBase64() != null && !profile.getLogoBase64().isEmpty()) {
            String contentType = profile.getLogoContentType() != null ? profile.getLogoContentType() : "image/png";
            String dataUrl = "data:" + contentType + ";base64," + profile.getLogoBase64();

            // Create a copy to avoid modifying the entity, return data URL in logoUrl
            return CompanyProfile.builder()
                    .id(profile.getId())
                    .companyName(profile.getCompanyName())
                    .companyNameArabic(profile.getCompanyNameArabic())
                    .address(profile.getAddress())
                    .phone(profile.getPhone())
                    .email(profile.getEmail())
                    .taxId(profile.getTaxId())
                    .commercialRegister(profile.getCommercialRegister())
                    .footerText(profile.getFooterText())
                    .logoUrl(dataUrl)
                    .build();
        }

        return profile;
    }

    /**
     * Get profile from database (internal use)
     */
    public CompanyProfile getProfileInternal() {
        return repository.findAll().stream().findFirst().orElseGet(this::createDefaultProfile);
    }

    public CompanyProfile updateProfile(CompanyProfile updatedProfile) {
        CompanyProfile existing = getProfileInternal();

        existing.setCompanyName(updatedProfile.getCompanyName());
        existing.setCompanyNameArabic(updatedProfile.getCompanyNameArabic());
        existing.setAddress(updatedProfile.getAddress());
        existing.setPhone(updatedProfile.getPhone());
        existing.setEmail(updatedProfile.getEmail());
        existing.setTaxId(updatedProfile.getTaxId());
        existing.setCommercialRegister(updatedProfile.getCommercialRegister());
        existing.setFooterText(updatedProfile.getFooterText());

        // Don't update logo here, handled separately

        CompanyProfile saved = repository.save(existing);

        // Invalidate all cached invoice PDFs to force regeneration with new profile data
        try {
            invoiceRepository.clearAllPdfUrls();
            log.info("Cleared all cached invoice PDF URLs due to profile update");
        } catch (Exception e) {
            log.error("Failed to clear PDF cache after profile update: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Upload and save company logo as base64 in database.
     * @param file The logo file to upload
     * @return Updated company profile
     */
    public CompanyProfile updateLogo(MultipartFile file) {
        CompanyProfile existing = getProfileInternal();

        try {
            // Convert file to base64
            byte[] fileBytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(fileBytes);

            // Get content type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                contentType = "image/png"; // default
            }

            // Update profile with base64 logo
            existing.setLogoBase64(base64);
            existing.setLogoContentType(contentType);
            existing.setLogoUrl(null); // Clear old file path if any

            log.info("Logo saved as base64, size: {} bytes, type: {}", fileBytes.length, contentType);

            CompanyProfile saved = repository.save(existing);

            // Invalidate all cached invoice PDFs to force regeneration with new logo
            try {
                invoiceRepository.clearAllPdfUrls();
                log.info("Cleared all cached invoice PDF URLs due to logo update");
            } catch (Exception e) {
                log.error("Failed to clear PDF cache after logo update: {}", e.getMessage());
            }

            // Return with data URL for frontend
            String dataUrl = "data:" + contentType + ";base64," + base64;
            saved.setLogoUrl(dataUrl);
            saved.setLogoBase64(null); // Don't send full base64 back in response

            return saved;

        } catch (IOException e) {
            log.error("Failed to process logo file: {}", e.getMessage());
            throw new RuntimeException("Failed to process logo file: " + e.getMessage(), e);
        }
    }

    /**
     * Get logo as byte array for PDF generation
     * @return Logo bytes or null if not set
     */
    public byte[] getLogoBytes() {
        CompanyProfile profile = getProfileInternal();
        if (profile.getLogoBase64() != null && !profile.getLogoBase64().isEmpty()) {
            try {
                return Base64.getDecoder().decode(profile.getLogoBase64());
            } catch (Exception e) {
                log.error("Failed to decode logo base64: {}", e.getMessage());
            }
        }
        return null;
    }

    /**
     * Get logo content type
     * @return Content type or null if not set
     */
    public String getLogoContentType() {
        CompanyProfile profile = getProfileInternal();
        return profile.getLogoContentType();
    }

    /**
     * Check if logo exists
     */
    public boolean hasLogo() {
        CompanyProfile profile = getProfileInternal();
        return profile.getLogoBase64() != null && !profile.getLogoBase64().isEmpty();
    }

    private CompanyProfile createDefaultProfile() {
        log.info("Creating default company profile");
        CompanyProfile defaultProfile = CompanyProfile.builder()
                .companyName("ElGuindy Glass Co.")
                .companyNameArabic("شركة الجندي للزجاج")
                .address("New Cairo, Fifth Settlement")
                .phone("+20 123 456 789")
                .email("info@elguindyglass.com")
                .footerText("ElGuindy Glass Co. | New Cairo | +20 123 456 789")
                .build();
        return repository.save(defaultProfile);
    }
}
