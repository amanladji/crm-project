#!/usr/bin/env python3
import psycopg2
import sys

# Database configuration
DB_HOST = 'dpg-d743hu94tr6s73civ140-a.oregon-postgres.render.com'
DB_PORT = 5432
DB_NAME = 'crm_database_hr6t'
DB_USER = 'crm_database_hr6t_user'
DB_PASSWORD = 'YoXV1OYKoAA04aZf1bkLtSs74gXGfEdU'

print("\n════════════════════════════════════════════════")
print("DATABASE CLEANUP UTILITY")
print("════════════════════════════════════════════════\n")

try:
    # Connect to database
    print("[1] Connecting to PostgreSQL database...")
    print(f"    Host: {DB_HOST}")
    print(f"    Database: {DB_NAME}\n")
    
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10
    )
    
    cursor = conn.cursor()
    print("✓ Connected successfully\n")
    
    # List tables before deletion
    print("[2] Listing tables in public schema...")
    cursor.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)
    tables = [row[0] for row in cursor.fetchall()]
    
    if tables:
        print(f"    Found {len(tables)} tables:")
        for table in tables:
            print(f"      - {table}")
    else:
        print("    No tables found - database already empty")
    
    # Drop all tables
    if tables:
        print("\n[3] Dropping all tables...")
        for table in tables:
            try:
                cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                print(f"    ✓ Dropped: {table}")
            except Exception as e:
                print(f"    ? Error dropping {table}: {e}")
        
        conn.commit()
        print("\n    ✓ All tables dropped successfully")
    
    # Verify database is empty
    print("\n[4] Verifying database is empty...")
    cursor.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    """)
    remaining = cursor.fetchall()
    
    if len(remaining) == 0:
        print("    ✓ Database is clean - all tables removed\n")
    else:
        print(f"    ? Warning: {len(remaining)} tables still exist")
    
    # Close connection
    cursor.close()
    conn.close()
    
    print("════════════════════════════════════════════════")
    print("DATABASE CLEANUP COMPLETE")
    print("════════════════════════════════════════════════")
    print("\nSummary:")
    print(f"  Tables dropped: {len(tables)}")
    print(f"  Remaining tables: {len(remaining)}")
    print("\nNote: Hibernate will recreate tables when the")
    print("application starts (ddl-auto=update)")
    print("════════════════════════════════════════════════\n")
    
except psycopg2.Error as e:
    print(f"\n✗ Database Error: {e}\n")
    sys.exit(1)
except Exception as e:
    print(f"\n✗ Unexpected Error: {e}\n")
    sys.exit(1)
