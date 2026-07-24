import requests

url = "http://127.0.0.1:5000/api/analyze-requirements"
filepath = "uploads/sample_requirement.txt"  # adjust path if needed

with open(filepath, "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)

print("Status Code:", response.status_code)
print("Response:")
print(response.json())