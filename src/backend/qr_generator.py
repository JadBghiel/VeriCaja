"""
QR Code Generation Module for VeriCaja
Generates AEAT-compliant Verifactu QR codes for Spanish tax compliance
"""

import qrcode
import io
import base64
import os
from datetime import datetime
from typing import Optional
from pathlib import Path


def generate_verifactu_qr(
    nif: str,
    invoice_number: str,
    date: datetime,
    total_amount: float,
    hash_value: str
) -> tuple[str, str]:
    """
    generate a verifactu compliant qr code for spanish tax compliance.
    
    args:
        nif: business nif (tax identification number)
        invoice_number: invoice series and number
        date: transaction date
        total_amount: total amount including iva
        hash_value: sha-256 cryptographic hash of the invoice
    
    returns:
        tuple of (qr_url, qr_base64_image)
        - qr_url: the url data that the qr code encodes
        - qr_base64_image: base64 encoded png image of the qr code
    
    example:
        url, img_b64 = generate_verifactu_qr(
            nif="12345678X",
            invoice_number="2026-00001",
            date=datetime.utcnow(),
            total_amount=125.50,
            hash_value="e3b0c442..."
        )
    """
    
    # format date as dd mm yyyy
    date_str = date.strftime("%d-%m-%Y")
    
    # format amount with period as decimal separator (aeat requirement)
    amount_str = f"{total_amount:.2f}".replace(",", ".")
    
    # Build the AEAT-compliant URL
    # Format: https://www2.agenciatributaria.gob.es/wlpl/AVAC-HPRIM/Verifactu?nif=[NIF]&numSerie=[Invoice]&fecha=[Date]&importe=[Amount]
    qr_url = (
        f"https://www2.agenciatributaria.gob.es/wlpl/AVAC-HPRIM/Verifactu?"
        f"nif={nif}&"
        f"numSerie={invoice_number}&"
        f"fecha={date_str}&"
        f"importe={amount_str}"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    # create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # convert to base64
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
    qr_image_data_url = f"data:image/png;base64,{img_base64}"
    
    return qr_url, qr_image_data_url


def validate_nif(nif: str) -> bool:
    """
    validate spanish nif format.
    nif format: 8 digits + 1 letter
    """
    if not isinstance(nif, str) or len(nif) != 9:
        return False
    
    # Check format: 8 digits + 1 letter
    if not nif[:8].isdigit() or not nif[8].isalpha():
        return False
    
    # validate letter (optional, simplified)
    valid_letters = "TRWAGMYFPDXBNJZSQVHLCKE"
    number_part = int(nif[:8])
    expected_letter = valid_letters[number_part % 23]
    
    return nif[8].upper() == expected_letter


def save_qr_image(
    invoice_number: str,
    qr_data_url: str,
    output_dir: str = "qr_codes"
) -> str:
    """
    save qr code image to filesystem with timestamp based filename.
    
    args:
        invoice_number: invoice number (for reference, not used in filename)
        qr_data_url: base64 data url of the qr code image
        output_dir: directory to save qr codes (default: "qr_codes")
    
    returns:
        path to the saved qr code image file
    """
    # create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # extract base64 data from data url
    # format: data:image/png;base64,<base64_data>
    if qr_data_url.startswith("data:image/png;base64,"):
        base64_data = qr_data_url.split(",")[1]
    else:
        base64_data = qr_data_url
    
    # decode base64 to bytes
    img_bytes = base64.b64decode(base64_data)
    
    # create timestamp based filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # yyyymmdd hhmmss mmm
    filename = f"QR_{timestamp}.png"
    file_path = output_path / filename
    
    # write to file
    with open(file_path, "wb") as f:
        f.write(img_bytes)
    
    return str(file_path)
