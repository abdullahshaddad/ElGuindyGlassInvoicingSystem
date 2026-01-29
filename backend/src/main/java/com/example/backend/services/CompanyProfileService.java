package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.repositories.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository repository;
    private final com.example.backend.repositories.InvoiceRepository invoiceRepository;

    @Value("${app.assets.path:./assets}")
    private String assetsPath;

    public CompanyProfileService(CompanyProfileRepository repository,
                                  com.example.backend.repositories.InvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Get profile for frontend display (with API URL for logo)
     */
    public CompanyProfile getProfile() {
        CompanyProfile profile = getProfileInternal();

        // Return API URL for logo instead of file path (for frontend display)
        if (profile.getLogoUrl() != null && !profile.getLogoUrl().isEmpty()) {
            // Create a copy to avoid modifying the entity
            CompanyProfile copy = CompanyProfile.builder()
                    .id(profile.getId())
                    .companyName(profile.getCompanyName())
                    .companyNameArabic(profile.getCompanyNameArabic())
                    .address(profile.getAddress())
                    .phone(profile.getPhone())
                    .email(profile.getEmail())
                    .taxId(profile.getTaxId())
                    .commercialRegister(profile.getCommercialRegister())
                    .footerText(profile.getFooterText())
                    .logoUrl("/api/v1/company-profile/logo")
                    .build();
            return copy;
        }

        return profile;
    }

    /**
     * Get profile from database (internal use)
     */
    private CompanyProfile getProfileInternal() {
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

        // Don't update logoUrl here, handled separately

        CompanyProfile saved = repository.save(existing);

        // Invalidate all cached invoice PDFs to force regeneration with new profile
        // data
        try {
            invoiceRepository.clearAllPdfUrls();
            log.info("Cleared all cached invoice PDF URLs due to profile update");
        } catch (Exception e) {
            log.error("Failed to clear PDF cache after profile update: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Upload and save company logo to local filesystem.
     * Deletes any existing logo before saving the new one.
     * @param file The logo file to upload
     * @return Updated company profile
     */
    public CompanyProfile updateLogo(MultipartFile file) {
        CompanyProfile existing = getProfileInternal();

        try {
            // Create assets directory if it doesn't exist
            Path assetsDir = Paths.get(assetsPath);
            if (!Files.exists(assetsDir)) {
                Files.createDirectories(assetsDir);
                log.info("Created assets directory: {}", assetsDir.toAbsolutePath());
            }

            // Delete any existing logo files first
            deleteExistingLogos(assetsDir);

            // Get file extension
            String originalFilename = file.getOriginalFilename();
            String extension = ".png"; // default
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            // Save as logo.png/jpg/etc in assets folder
            String logoFilename = "logo" + extension;
            Path logoPath = assetsDir.resolve(logoFilename);

            // Copy file to assets folder
            Files.copy(file.getInputStream(), logoPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Logo saved to: {}", logoPath.toAbsolutePath());

            // Update profile with the local path
            existing.setLogoUrl(logoPath.toString());
            CompanyProfile saved = repository.save(existing);

            // Invalidate all cached invoice PDFs to force regeneration with new logo
            try {
                invoiceRepository.clearAllPdfUrls();
                log.info("Cleared all cached invoice PDF URLs due to logo update");
            } catch (Exception e) {
                log.error("Failed to clear PDF cache after logo update: {}", e.getMessage());
            }

            // Return with API URL for frontend
            saved.setLogoUrl("/api/v1/company-profile/logo");
            return saved;

        } catch (IOException e) {
            log.error("Failed to save logo file: {}", e.getMessage());
            throw new RuntimeException("Failed to save logo file: " + e.getMessage(), e);
        }
    }

    /**
     * Delete all existing logo files from assets directory
     */
    private void deleteExistingLogos(Path assetsDir) {
        String[] logoExtensions = {"png", "jpg", "jpeg", "gif", "webp", "svg"};
        for (String ext : logoExtensions) {
            try {
                Path logoFile = assetsDir.resolve("logo." + ext);
                if (Files.exists(logoFile)) {
                    Files.delete(logoFile);
                    log.info("Deleted existing logo: {}", logoFile);
                }
            } catch (IOException e) {
                log.warn("Failed to delete existing logo with extension {}: {}", ext, e.getMessage());
            }
        }
    }

    /**
     * Get the logo file path
     * @return Path to logo file or null if not set
     */
    public String getLogoPath() {
        CompanyProfile profile = getProfileInternal();
        if (profile.getLogoUrl() != null && !profile.getLogoUrl().isEmpty()) {
            return profile.getLogoUrl();
        }
        // Check for default logo in assets
        Path defaultLogo = Paths.get(assetsPath, "logo.png");
        if (Files.exists(defaultLogo)) {
            return defaultLogo.toString();
        }
        return null;
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
