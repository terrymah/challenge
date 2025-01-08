import csv
import re

# Input and output file paths
input_file = "voters.txt"
output_file = "voters.csv"

# Regular expression to match the rows
pattern = re.compile(r"^(\S+)\s+([^,]+),\s+(\S+)(?:\s+(.*?))?\s+(\d{5})$")

def process_line(line):
    match = pattern.match(line.strip())
    if match:
        county = match.group(1)
        last_name = match.group(2)
        first_name = match.group(3)
        middle_name = match.group(4) if match.group(4) else ""
        zip_code = match.group(5)
        return [county, last_name, first_name, middle_name, zip_code]
    return None

def process_file():
    with open(input_file, "r") as infile, open(output_file, "w", newline="") as outfile:
        csv_writer = csv.writer(outfile)
        # Write header
        csv_writer.writerow(["county", "lastname", "firstname", "middlename", "zip"])
        
        for line in infile:
            processed = process_line(line)
            if processed:
                csv_writer.writerow(processed)

if __name__ == "__main__":
    process_file()
    print(f"Processing complete. Output written to {output_file}")
