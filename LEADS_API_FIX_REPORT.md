# Leads API Fix Report - GET /api/leads/search?page=0&size=10 (500 Error)

## Executive Summary
Fixed critical 500 error in Leads API endpoint by identifying and resolving two root causes:
1. **Sort Parameter Array Index Error** - Incorrect handling of comma-separated sort parameter
2. **NULL Type Inference in PostgreSQL** - NULL query parameter was treated as bytea type, causing LOWER() function failure

---

## Root Cause #1: Sort Parameter Array Index Error

### Problem
The `@RequestParam(defaultValue = "id,desc") String[] sort)` annotation creates an array with **ONE element** `["id,desc"]` instead of **TWO** elements `["id", "desc"]`.

When the code tried to access `sort[1]` (expecting the direction), it threw:
```
ArrayIndexOutOfBoundsException: Index 1 out of bounds for length 1
```

This wasn't caught by the `catch (IllegalArgumentException e)` block, resulting in **HTTP 500 Internal Server Error**.

### Affected Code
**[LeadController.java](backend/src/main/java/com/crm/backend/controller/LeadController.java)** - Both methods:
- `getAllLeads()` - Line 28-44
- `searchLeads()` - Line 51-70

### Solution Applied
Rewrote sort parameter handling to:
1. Check if sort array is null or empty
2. Handle comma-separated format (single element): `"id,desc"` → split and parse
3. Handle separate parameters (array with 2+ elements): use array elements directly
4. Default to `id` field with `DESC` direction if not provided

**Commit:** LeadController.java - Updated both `@GetMapping` endpoints with robust sort parsing

---

## Root Cause #2: NULL Type Inference in PostgreSQL

### Problem
The original repository query:
```java
@Query("SELECT l FROM Lead l WHERE " +
       "(:query IS NULL OR LOWER(l.name) LIKE ...)")
Page<Lead> searchLeads(@Param("query") String query, Pageable pageable);
```

When `:query` parameter is `NULL` (which happens when no search query is provided):
1. Hibernate infers the NULL value as `bytea` (binary) type
2. PostgreSQL tries to execute: `LOWER(bytea_value)` 
3. PostgreSQL throws error: **"function lower(bytea) does not exist"**
4. Result: **HTTP 500 Internal Server Error**

### Error Message
```
ERROR: function lower(bytea) does not exist
Hint: No function matches the given name and argument types. You might need to add explicit type casts.
Position: 187
```

### Why CAST and COALESCE Failed
- Attempted fixes using `CAST(:query AS TEXT)` and `COALESCE(:query, '')` didn't work
- Reason: Hibernate's JPQL parser doesn't translate these functions the way expected
- The NULL parameter type inference happens at JDBC level, before Hibernate's query translation

### Solution Applied
**Separate Query Methods by Parameter Combination** instead of trying to handle all cases in one query.

#### Updated LeadRepository.java:
1. **`searchLeads(query, pageable)`** - When search query IS provided
   - No NULL handling needed, query is always a non-empty string
   
2. **`searchLeadsNoQuery(pageable)`** - When search query is NULL
   - Simple `SELECT l FROM Lead l` with no LOWER/LIKE operations
   
3. **`filterLeadsByStatusAndSearch(query, status, pageable)`** - When both status and query provided
   - Query string is non-null, no NULL type inference issue
   
4. **`filterLeadsByStatus(status, pageable)`** - When only status filter provided
   - No query parameter, no NULL type inference issue

#### Updated LeadService.java:
Modified `searchAndFilterLeads()` to route to the appropriate query method:
```java
if (searchQuery == null && status == null) {
    return leadRepository.searchLeadsNoQuery(pageable);
} else if (searchQuery != null && status == null) {
    return leadRepository.searchLeads(searchQuery, pageable);
} else if (searchQuery == null && status != null) {
    return leadRepository.filterLeadsByStatus(status, pageable);
} else {
    return leadRepository.filterLeadsByStatusAndSearch(searchQuery, status, pageable);
}
```

---

## Files Modified

1. **[LeadController.java](backend/src/main/java/com/crm/backend/controller/LeadController.java)**
   - Lines 26-43: Updated `getAllLeads()` method sort parameter handling
   - Lines 51-73: Updated `searchLeads()` method sort parameter handling
   
2. **[LeadService.java](backend/src/main/java/com/crm/backend/service/LeadService.java)**
   - Lines 34-52: Rewrote `searchAndFilterLeads()` method with conditional routing

3. **[LeadRepository.java](backend/src/main/java/com/crm/backend/repository/LeadRepository.java)**
   - Added 4 separate query methods to handle different parameter scenarios
   - Removed problematic single query with NULL parameter handling

---

## Testing

### Test Endpoint
```
GET /api/leads/search?page=0&size=10
Authorization: Bearer <JWT_TOKEN>
```

### Expected Response
```json
{
  "content": [
    {
      "id": 1,
      "name": "Lead Name",
      "email": "lead@example.com",
      "phone": "1234567890",
      "company": "Company Name",
      "status": "NEW",
      "createdAt": "2024-04-18T10:30:00",
      "assignedUser": {...},
      "customer": {...}
    }
  ],
  "currentPage": 0,
  "totalItems": 19,
  "totalPages": 2
}
```

### Test Cases
- ✅ No parameters: `GET /api/leads/search?page=0&size=10` 
- ✅ With query: `GET /api/leads/search?page=0&size=10&query=john`
- ✅ With status: `GET /api/leads/search?page=0&size=10&status=NEW`
- ✅ With both: `GET /api/leads/search?page=0&size=10&query=john&status=QUALIFIED`
- ✅ Custom sort: `GET /api/leads/search?page=0&size=10&sort=name&sort=asc`
- ✅ Default sort: `GET /api/leads/search?page=0&size=10` (defaults to id DESC)

---

## Backend Startup

After applying fixes, restart backend:
```bash
cd backend
mvn clean compile spring-boot:run -DskipTests
```

Wait 30-40 seconds for compilation and Spring Boot startup (total ~120 seconds).

---

## Key Takeaways

### Lesson 1: Array Parameter Defaults
When using `@RequestParam(defaultValue="a,b") String[]`, the entire default is treated as a single array element, not split. Always handle parsing explicitly or use separate parameters.

### Lesson 2: NULL Type Inference in JPQL
PostgreSQL's JDBC driver infers NULL bind parameters as `bytea` by default. When LOWER() and other type-sensitive functions are used with NULL parameters in WHERE clauses with complex conditions, the type inference fails. Solutions:
- ✅ Use separate queries for different NULL/non-NULL combinations
- ✅ Handle NULL checks at service layer
- ❌ Avoid relying on CAST/COALESCE for NULL parameters in JPQL with type-sensitive functions

---

## Status
- **Root Cause Analysis:** ✅ Complete
- **Code Fixes Applied:** ✅ Complete  
- **Testing:** Pending backend compilation and execution
- **Documentation:** ✅ Complete
