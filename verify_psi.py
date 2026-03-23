from psi_engine import psi_service

bank_a = ["TOKEN1", "TOKEN2", "TOKEN3"]
bank_b = ["TOKEN3", "TOKEN4", "TOKEN5"]

# Simulate encryption at the edge
salt = "SATARK_PSI_SALT_2026"
import hashlib
def encrypt(t):
    return hashlib.sha256((salt + t).encode()).hexdigest()

cipher_a = [encrypt(t) for t in bank_a]
cipher_b = [encrypt(t) for t in bank_b]

print(f"Bank A Ciphertexts: {cipher_a}")
print(f"Bank B Ciphertexts: {cipher_b}")

intersection = psi_service.intersect(cipher_a, cipher_b)
print(f"Intersection: {intersection}")

if len(intersection) == 1:
    print("PSI VERIFICATION: SUCCESS")
else:
    print("PSI VERIFICATION: FAILED")
