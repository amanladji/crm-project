package com.crm.backend.config;

import com.crm.backend.entity.Activity;
import com.crm.backend.entity.Customer;
import com.crm.backend.entity.Lead;
import com.crm.backend.entity.User;
import com.crm.backend.enums.ActivityType;
import com.crm.backend.enums.LeadStatus;
import com.crm.backend.enums.Role;
import com.crm.backend.repository.ActivityRepository;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (customerRepository.count() == 0) {
            seedData();
        }
    }

    private void seedData() {
        System.out.println("🌱 Seeding realistic CRM data...");

        // 1. Ensure at least one user exists (Admin / agent)
        User adminUser = userRepository.findByUsername("admin").orElseGet(() -> {
            User user = new User();
            user.setUsername("admin");
            user.setEmail("admin@example.com");
            user.setPassword(passwordEncoder.encode("admin123"));
            user.setRole(Role.ADMIN);
            return userRepository.save(user);
        });
        
        // Create test users for chat functionality
        User amanUser = userRepository.findByUsername("aman").orElseGet(() -> {
            User user = new User();
            user.setUsername("aman");
            user.setEmail("aman@example.com");
            user.setPassword(passwordEncoder.encode("aman123456"));
            user.setRole(Role.USER);
            System.out.println("✓ Created test user: aman");
            return userRepository.save(user);
        });
        
        User ahmedUser = userRepository.findByUsername("ahmed").orElseGet(() -> {
            User user = new User();
            user.setUsername("ahmed");
            user.setEmail("ahmed@example.com");
            user.setPassword(passwordEncoder.encode("ahmed123456"));
            user.setRole(Role.USER);
            System.out.println("✓ Created test user: ahmed");
            return userRepository.save(user);
        });
        
        User sarahUser = userRepository.findByUsername("sarah").orElseGet(() -> {
            User user = new User();
            user.setUsername("sarah");
            user.setEmail("sarah@example.com");
            user.setPassword(passwordEncoder.encode("sarah123456"));
            user.setRole(Role.USER);
            System.out.println("✓ Created test user: sarah");
            return userRepository.save(user);
        });

        // 2. Create Realistic Customers
        List<Customer> sampleCustomers = Arrays.asList(
            createCustomer("John Doe", "john.doe@techcorp.com", "1234567890", "TechCorp", "123 Silicon Valley, CA"),
            createCustomer("Alice Smith", "alice@finserve.com", "9876543210", "FinServe", "45 Wall St, NY"),
            createCustomer("Michael Johnson", "michael.j@healthplus.org", "5671238901", "HealthPlus", "90 Wellness Ave, TX"),
            createCustomer("Emily Davis", "emily.davis@retailgiant.com", "4567890123", "Retail Giant", "450 Market Pl, FL"),
            createCustomer("Robert Williams", "robert.w@logistics.net", "3456789012", "Fast Logistics", "22 Cargo Way, IL"),
            createCustomer("Sarah Brown", "sarah.b@edusystems.edu", "2345678901", "EduSystems", "110 Campus Dr, MA"),
            createCustomer("David Wilson", "david.w@cybersec.com", "6789012345", "CyberSec Solutions", "300 Network Blvd, WA"),
            createCustomer("Jessica Taylor", "jtaylor@marketingpro.com", "7890123456", "Marketing Pro", "5A Agency Row, CO"),
            createCustomer("James Anderson", "janderson@buildit.com", "8901234567", "BuildIt Construction", "99 Constructor Rd, NV"),
            createCustomer("Laura Thomas", "laura.t@greentemp.com", "9012345678", "Green Energy", "77 Solar Panel Ln, OR")
        );
        customerRepository.saveAll(sampleCustomers);

        // 3. Create Sample Leads linked to Customers
        Random random = new Random();
        List<Lead> sampleLeads = Arrays.asList(
            createLead("Website Redesign Deal", "john.doe@techcorp.com", "1234567890", "TechCorp", LeadStatus.NEW, sampleCustomers.get(0), adminUser),
            createLead("Cloud Migration Plan", "john.doe@techcorp.com", "1234567890", "TechCorp", LeadStatus.CONTACTED, sampleCustomers.get(0), adminUser),
            
            createLead("Payment Gateway Integration", "alice@finserve.com", "9876543210", "FinServe", LeadStatus.QUALIFIED, sampleCustomers.get(1), adminUser),
            createLead("Mobile Trading App", "alice@finserve.com", "9876543210", "FinServe", LeadStatus.CONVERTED, sampleCustomers.get(1), adminUser),
            
            createLead("Patient Portal Update", "michael.j@healthplus.org", "5671238901", "HealthPlus", LeadStatus.LOST, sampleCustomers.get(2), adminUser),
            createLead("Telehealth API", "michael.j@healthplus.org", "5671238901", "HealthPlus", LeadStatus.NEW, sampleCustomers.get(2), adminUser),
            
            createLead("Inventory System Upsell", "emily.davis@retailgiant.com", "4567890123", "Retail Giant", LeadStatus.CONVERTED, sampleCustomers.get(3), adminUser),
            createLead("Ecommerce App Development", "emily.davis@retailgiant.com", "4567890123", "Retail Giant", LeadStatus.CONTACTED, sampleCustomers.get(3), adminUser),
            createLead("Loyalty Program Rollout", "emily.davis@retailgiant.com", "4567890123", "Retail Giant", LeadStatus.NEW, sampleCustomers.get(3), adminUser),
            
            createLead("Fleet Tracking Extension", "robert.w@logistics.net", "3456789012", "Fast Logistics", LeadStatus.CONTACTED, sampleCustomers.get(4), adminUser),
            createLead("Warehouse API Integration", "robert.w@logistics.net", "3456789012", "Fast Logistics", LeadStatus.QUALIFIED, sampleCustomers.get(4), adminUser),
            
            createLead("Student LMS Upgrade", "sarah.b@edusystems.edu", "2345678901", "EduSystems", LeadStatus.NEW, sampleCustomers.get(5), adminUser),
            
            createLead("Security Audit Setup", "david.w@cybersec.com", "6789012345", "CyberSec Solutions", LeadStatus.CONVERTED, sampleCustomers.get(6), adminUser),
            createLead("Penetration Testing Request", "david.w@cybersec.com", "6789012345", "CyberSec Solutions", LeadStatus.QUALIFIED, sampleCustomers.get(6), adminUser),
            
            createLead("CRM Customization", "jtaylor@marketingpro.com", "7890123456", "Marketing Pro", LeadStatus.CONTACTED, sampleCustomers.get(7), adminUser),
            createLead("Email Campaign Integration", "jtaylor@marketingpro.com", "7890123456", "Marketing Pro", LeadStatus.LOST, sampleCustomers.get(7), adminUser),
            
            createLead("Project Bidding Software", "janderson@buildit.com", "8901234567", "BuildIt Construction", LeadStatus.NEW, sampleCustomers.get(8), adminUser),
            
            createLead("IoT Sensor Analytics", "laura.t@greentemp.com", "9012345678", "Green Energy", LeadStatus.CONVERTED, sampleCustomers.get(9), adminUser),
            createLead("Solar Panel Dashboard", "laura.t@greentemp.com", "9012345678", "Green Energy", LeadStatus.CONTACTED, sampleCustomers.get(9), adminUser)
        );
        leadRepository.saveAll(sampleLeads);

        // 4. Create Activities for each Customer & Lead
        for (Customer customer : sampleCustomers) {
            Activity act1 = new Activity(null, "Called customer to setup initial introduction", ActivityType.CALL, LocalDateTime.now().minusDays(random.nextInt(10) + 1), null, customer, adminUser);
            Activity act2 = new Activity(null, "Sent company portfolio and pricing email", ActivityType.EMAIL, LocalDateTime.now().minusDays(random.nextInt(5) + 1), null, customer, adminUser);
            Activity act3 = new Activity(null, "Video meeting to discuss exact requirements", ActivityType.MEETING, LocalDateTime.now().minusDays(random.nextInt(2)), null, customer, adminUser);
            activityRepository.saveAll(Arrays.asList(act1, act2, act3));
        }

        // Link a few activities specifically to leads
        for (Lead lead : sampleLeads) {
            String actDesc = switch (lead.getStatus()) {
                case NEW -> "Emailed prospect about the " + lead.getName();
                case CONTACTED -> "Called prospect to discuss " + lead.getName();
                case QUALIFIED -> "Met with prospect to finalize scoping for " + lead.getName();
                case CONVERTED -> "Deal won! Sent contract for " + lead.getName();
                case LOST -> "Deal lost. Competitor chosen for " + lead.getName();
            };
            ActivityType actType = switch (lead.getStatus()) {
                case NEW -> ActivityType.EMAIL;
                case CONTACTED -> ActivityType.CALL;
                case QUALIFIED, CONVERTED -> ActivityType.MEETING;
                case LOST -> ActivityType.NOTE;
            };
            
            Activity leadActivity = new Activity(null, actDesc, actType, LocalDateTime.now().minusDays(random.nextInt(14)), lead, lead.getCustomer(), adminUser);
            activityRepository.save(leadActivity);
        }

        System.out.println("✅ Sample data loaded successfully!");
    }

    private Customer createCustomer(String name, String email, String phone, String company, String address) {
        Customer c = new Customer();
        c.setName(name);
        c.setEmail(email);
        c.setPhone(phone);
        c.setCompany(company);
        c.setAddress(address);
        return c;
    }

    private Lead createLead(String title, String email, String phone, String company, LeadStatus status, Customer customer, User user) {
        Lead l = new Lead();
        l.setName(title); // Treating 'name' as Title/Subject in CRM Context per instructions
        l.setEmail(email);
        l.setPhone(phone);
        l.setCompany(company);
        l.setStatus(status);
        l.setCustomer(customer);
        l.setAssignedUser(user);
        return l;
    }
}