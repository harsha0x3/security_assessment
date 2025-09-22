import os
from msal import ConfidentialClientApplication
import httpx
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

# Azure AD App Credentials
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
tenant_id = os.getenv("TENANT_ID")
email_sender_admin = os.getenv("EMAIL_ADDRESS")

authority = f"https://login.microsoftonline.com/{tenant_id}"
scopes = ["https://graph.microsoft.com/.default"]
graph_endpoint = f"https://graph.microsoft.com/v1.0/users/{email_sender_admin}/sendMail"


def fetch_token():
    """Fetch Microsoft Graph access token using MSAL."""
    app = ConfidentialClientApplication(
        client_id, authority=authority, client_credential=client_secret
    )

    result = app.acquire_token_for_client(scopes=scopes)
    if not result:
        return {"success":False}  
    return {"success":True ,"token":result.get("access_token")}


async def send_email(
    client: httpx.AsyncClient,
    access_token: str,
    custom_message: str | None = None
):
    try:
        response = await client.post(
            graph_endpoint,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            content=json.dumps(email_msg),
        )
        if response.status_code == 202:
            return {
                "email": manager_email,
                "status": "success",
                "code": response.status_code,
                "message": response.text,
            }
        else:
            return {
                "email": manager_email,
                "status": "error",
                "code": response.status_code,
                "message": response.text,
            }

    except Exception as e:
        return {"email": manager_email, "status": "not sent", "message": str(e)}