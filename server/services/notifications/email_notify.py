import os
from msal import ConfidentialClientApplication
import httpx
from dotenv import load_dotenv
import json
from models.schemas.crud_schemas import UserOut
from fastapi import HTTPException, status

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
        return {"success": False}
    return {"success": True, "token": result.get("access_token")}


async def send_email(
    subject: str,
    reciepient: UserOut,
    message: str | None = None,
):
    try:
        token = fetch_token()
        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access token not found for sending mail",
            )
        access_token = token["token"]
        reciepient_name = (
            f"{reciepient.first_name} {reciepient.last_name}"
            if reciepient.last_name
            else f"{reciepient.first_name}"
        )
        html_body = f"""
                        <html>
                        <body>
                            <h2>Hello {reciepient_name},</h2>
                            <p>{message}</p>
                            <p>Thankyou.</p>
                        </body>
                        </html>

                    """

        email_msg = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_body},
                "toRecipients": [{"emailAddress": {"address": reciepient.email}}],
            }
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                graph_endpoint,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                content=json.dumps(email_msg),
            )
            if response.status_code == 202:
                print({"success": True, "status_code": response.status_code})
                print(response.__dict__)
                return {"success": True, "status_code": response.status_code}
            else:
                print({"success": False, "status_code": response.status_code})
                print(response.__dict__)

                return {"success": False, "status_code": response.status_code}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send mail {str(e)}",
        )
