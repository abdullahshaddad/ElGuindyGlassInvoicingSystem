package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.repositories.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileService {

    private final CompanyProfileRepository repository;
    private final StorageService storageService;
    private final com.example.backend.repositories.InvoiceRepository invoiceRepository;

    public CompanyProfile getProfile() {
        return repository.findAll().stream().findFirst().orElseGet(this::createDefaultProfile);
    }

    public CompanyProfile updateProfile(CompanyProfile updatedProfile) {
        CompanyProfile existing = getProfile();

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

    public CompanyProfile updateLogo(MultipartFile file) {
        CompanyProfile existing = getProfile();

        String logoUrl = storageService.storeFile(file, "company-assets");
        existing.setLogoUrl(logoUrl);

        CompanyProfile saved = repository.save(existing);

        // Invalidate all cached invoice PDFs to force regeneration with new logo
        try {
            invoiceRepository.clearAllPdfUrls();
            log.info("Cleared all cached invoice PDF URLs due to logo update");
        } catch (Exception e) {
            log.error("Failed to clear PDF cache after logo update: {}", e.getMessage());
        }

        return saved;
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
