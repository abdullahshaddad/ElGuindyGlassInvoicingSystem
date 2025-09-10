package com.example.backend.controllers;

import com.example.backend.models.PrintJob;
import com.example.backend.services.PrintJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/print-jobs")
@CrossOrigin(origins = "*")
public class PrintJobController {

    private final PrintJobService printJobService;

    @Autowired
    public PrintJobController(PrintJobService printJobService) {
        this.printJobService = printJobService;
    }

    @GetMapping("/queue")
    public ResponseEntity<List<PrintJob>> getQueuedJobs() {
        List<PrintJob> jobs = printJobService.getQueuedJobs();
        return ResponseEntity.ok(jobs);
    }

    @PutMapping("/{id}/printing")
    public ResponseEntity<PrintJob> markAsPrinting(@PathVariable Long id) {
        PrintJob job = printJobService.markAsPrinting(id);
        return ResponseEntity.ok(job);
    }

    @PutMapping("/{id}/printed")
    public ResponseEntity<PrintJob> markAsPrinted(@PathVariable Long id) {
        PrintJob job = printJobService.markAsPrinted(id);
        return ResponseEntity.ok(job);
    }

    @PutMapping("/{id}/failed")
    public ResponseEntity<PrintJob> markAsFailed(@PathVariable Long id, @RequestBody String errorMessage) {
        PrintJob job = printJobService.markAsFailed(id, errorMessage);
        return ResponseEntity.ok(job);
    }
}
