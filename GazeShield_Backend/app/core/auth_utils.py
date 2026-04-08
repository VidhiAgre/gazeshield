from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Bcrypt max password length = 72 bytes
MAX_BCRYPT_LEN = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    pw = password[:MAX_BCRYPT_LEN]  # truncate to 72 bytes
    return pwd_context.hash(pw)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw = plain_password[:MAX_BCRYPT_LEN]  # truncate to 72 bytes
    return pwd_context.verify(pw, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)