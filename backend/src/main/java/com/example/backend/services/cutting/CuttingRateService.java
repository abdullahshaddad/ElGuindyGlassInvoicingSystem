  package com.example.backend.services.cutting;
          
          import com.example.backend.models.CuttingRate;
  import com.example.backend.models.enums.CuttingType;
  import com.example.backend.repositories.CuttingRateRepository;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;
  
          import java.util.Arrays;
  import java.util.List;
  import java.util.Optional;
  
          @Service
  @Transactional
  public class CuttingRateService {
  
              private final CuttingRateRepository cuttingRateRepository;
  
              @Autowired
      public CuttingRateService(CuttingRateRepository cuttingRateRepository) {
                  this.cuttingRateRepository = cuttingRateRepository;
              }
  
              public List<CuttingRate> findAllActive() {
                  return cuttingRateRepository.findAll().stream()
                                  .filter(CuttingRate::getActive)
                                  .toList();
              }
  
              public List<CuttingRate> findByType(CuttingType cuttingType) {
                  return cuttingRateRepository.findByCuttingTypeAndActiveTrue(cuttingType);
              }
  
              public CuttingRate save(CuttingRate cuttingRate) {
                  validateCuttingRate(cuttingRate);
                  return cuttingRateRepository.save(cuttingRate);
              }
  
              public void deactivate(Long id) {
                  Optional<CuttingRate> rate = cuttingRateRepository.findById(id);
                  if (rate.isPresent()) {
                          CuttingRate cuttingRate = rate.get();
                          cuttingRate.setActive(false);
                          cuttingRateRepository.save(cuttingRate);
                      }
              }
  
              public Double getRateForThickness(CuttingType cuttingType, Double thickness) {
                  return cuttingRateRepository.findRateByTypeAndThickness(cuttingType, thickness)
                                  .map(CuttingRate::getRatePerMeter)
                                  .orElse(10.0); // Default fallback rate
              }
  
              public List<CuttingRate> initializeDefaultRates() {
                  // Initialize default Shatf rates based on original hardcoded values
                          List<CuttingRate> defaultRates = Arrays.asList(
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(0.0).maxThickness(3.0).ratePerMeter(5.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(3.1).maxThickness(4.0).ratePerMeter(7.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(4.1).maxThickness(5.0).ratePerMeter(9.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(5.1).maxThickness(6.0).ratePerMeter(11.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(6.1).maxThickness(8.0).ratePerMeter(13.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(8.1).maxThickness(10.0).ratePerMeter(15.0).active(true).build(),
                                  CuttingRate.builder().cuttingType(CuttingType.SHATF).minThickness(10.1).maxThickness(50.0).ratePerMeter(18.0).active(true).build()
                                  );
          
                          return cuttingRateRepository.saveAll(defaultRates);
              }
  
              private void validateCuttingRate(CuttingRate cuttingRate) {
                  if (cuttingRate.getCuttingType() == null) {
                          throw new IllegalArgumentException("Cutting type is required");
                      }
                  if (cuttingRate.getMinThickness() == null || cuttingRate.getMinThickness() < 0) {
                          throw new IllegalArgumentException("Min thickness must be non-negative");
                      }
                  if (cuttingRate.getMaxThickness() == null || cuttingRate.getMaxThickness() <= cuttingRate.getMinThickness()) {
                          throw new IllegalArgumentException("Max thickness must be greater than min thickness");
                      }
                  if (cuttingRate.getRatePerMeter() == null || cuttingRate.getRatePerMeter() <= 0) {
                          throw new IllegalArgumentException("Rate per meter must be positive");
                      }
              }
  }