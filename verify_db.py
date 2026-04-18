import psycopg2
import sys

print("\n------------------------------------------------")
print("DATABASE VERIFICATION REPORT")
print("------------------------------------------------")

try:
    print("\n[1] Connecting to PostgreSQL database...")
    conn = psycopg2.connect(
        host='dpg-d743hu94tr6s73civ140-a.oregon-postgres.render.com',
        port=5432,
        database='crm_database_hr6t',
        user='crm_database_hr6t_user',
        password='YoXV1OYKoAA04aZf1bkLtSs74gXGfEdU',
        connect_timeout=10
    )
    print("    ? Connected successfully")
    
    cursor = conn.cursor()
    
    print("\n[2] Querying tables in public schema...")
    cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    tables = cursor.fetchall()
    
    print(f"    Total tables found: {len(tables)}")
    if tables:
        print("    Tables:")
        for table in tables:
            print(f"      - {table[0]}")
    else:
        print("    ? Database is empty - no tables found!")
    
    print("\n[3] Database Summary")
    print("------------------------------------------------")
    if len(tables) == 0:
        print("? STATUS: DATABASE CLEANED SUCCESSFULLY")
        print("  All tables have been removed")
        print("  Hibernate will recreate tables on next app startup")
    else:
        print(f"? STATUS: DATABASE CONTAINS {len(tables)} TABLE(S)")
        print("  Cleanup may not have completed")
    print("------------------------------------------------\n")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n? Error connecting to database: {str(e)}")
    sys.exit(1)
