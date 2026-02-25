import io
from django.core.files.base import ContentFile
from xhtml2pdf import pisa
from django.utils import timezone

def generate_contract_pdf(bid):
    rfq = bid.shipment.rfq
    org = rfq.created_by
    vendor = bid.vendor
    
    # Format the date and money to look professional
    current_date = timezone.now().strftime('%B %d, %Y')
    formatted_amount = f"{bid.amount:,.2f}"
    
    # Calculate a mock percentage for the visual cost bar
    base_cost_pct = 80
    surcharge_pct = 20
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: a4 portrait;
                margin: 1.5cm 2cm 2cm 2cm;
                @frame footer_frame {{
                    -pdf-frame-content: footer_content;
                    left: 2cm; right: 2cm; bottom: 1cm; height: 1.5cm;
                }}
            }}
            body {{ 
                font-family: Helvetica, Arial, sans-serif; 
                font-size: 11px; 
                color: #1e293b; 
                line-height: 1.5;
            }}
            
            /* --- HEADER & LOGO --- */
            .header-table {{ width: 100%; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }}
            .logo {{ font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }}
            .logo-os {{ color: #ea580c; }} /* Primary Orange */
            .doc-type {{ font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; text-align: right; font-weight: bold; }}
            .doc-ref {{ font-size: 16px; font-weight: bold; color: #0f172a; text-align: right; margin-top: 5px; }}
            .doc-date {{ font-size: 12px; color: #ea580c; text-align: right; font-weight: bold; margin-top: 5px; }} /* Primary Orange */
            
            /* --- TWO COLUMN PARTIES --- */
            .parties-table {{ width: 100%; margin-bottom: 30px; }}
            .party-box {{ background-color: #f8fafc; padding: 20px; border-left: 4px solid #cbd5e1; }}
            .party-box.vendor {{ border-left: 4px solid #ea580c; background-color: #fff7ed; }} /* Light Orange BG, Dark Orange Border */
            .party-spacer {{ width: 4%; }}
            .party-title {{ font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 10px; font-weight: bold; letter-spacing: 0.5px; }}
            .party-title.vendor-title {{ color: #c2410c; }}
            .party-name {{ font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }}
            .party-name.vendor-name {{ color: #ea580c; }}
            .party-sub {{ font-size: 11px; color: #475569; margin-bottom: 2px; }}

            /* --- METRICS / ANALYTICS BAR --- */
            .section-title {{ font-size: 13px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }}
            
            .metrics-table {{ width: 100%; margin-bottom: 25px; background-color: #ffffff; border-collapse: collapse; }}
            .metric-box {{ text-align: center; padding: 18px 10px; border: 1px solid #e2e8f0; width: 33.33%; }}
            .metric-box.highlight {{ background-color: #fff7ed; border: 1px solid #fdba74; }} /* Orange Tint */
            .metric-label {{ font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }}
            .metric-value {{ font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 6px; }}
            .metric-value.orange {{ color: #ea580c; }}
            .metric-sub {{ font-size: 10px; color: #94a3b8; margin-top: 4px; }}

            /* --- VISUAL TIMELINE (CSS CHART) --- */
            .timeline-table {{ width: 100%; margin-bottom: 35px; border-collapse: collapse; text-align: center; }}
            .timeline-line {{ border-top: 2px dashed #cbd5e1; padding-top: 10px; width: 40%; }}
            .timeline-node {{ width: 20%; font-weight: bold; color: #0f172a; font-size: 14px; }}
            .timeline-label {{ font-size: 9px; color: #64748b; text-transform: uppercase; margin-top: 4px; }}

            /* --- SCOPE OF WORK --- */
            .details-table {{ width: 100%; border-collapse: collapse; margin-bottom: 35px; }}
            .details-table th, .details-table td {{ padding: 14px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
            .details-table th {{ background-color: #f8fafc; color: #475569; font-size: 10px; text-transform: uppercase; font-weight: bold; width: 35%; }}
            .details-table td {{ font-size: 12px; color: #0f172a; font-weight: bold; }}

            /* --- FINANCIAL ANALYTICS & TOTALS --- */
            .finance-chart-table {{ width: 100%; margin-bottom: 15px; border-collapse: collapse; }}
            .bar-base {{ background-color: #0f172a; height: 8px; }} /* Dark Slate */
            .bar-surcharge {{ background-color: #fb923c; height: 8px; }} /* Bright Orange */
            .legend {{ font-size: 9px; color: #64748b; text-transform: uppercase; padding-top: 5px; }}

            .financials-table {{ width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #e2e8f0; }}
            .financials-table th {{ background-color: #f8fafc; color: #475569; padding: 14px 15px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }}
            .financials-table td {{ padding: 14px 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; }}
            .total-row td {{ background-color: #fff7ed; border-bottom: none; font-size: 20px; color: #ea580c; text-align: right; font-weight: bold; padding: 20px 15px; }}
            .total-label {{ text-align: left !important; font-size: 14px !important; color: #c2410c !important; text-transform: uppercase; }}

            /* --- FOOTER --- */
            .footer-text {{ font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; line-height: 1.5; }}
        </style>
    </head>
    <body>
        
        <table class="header-table">
            <tr>
                <td style="width: 50%; vertical-align: bottom;">
                    <div class="logo">Freight<span class="logo-os">OS</span></div>
                </td>
                <td style="width: 50%; vertical-align: bottom;">
                    <div class="doc-type">Digital Freight Agreement</div>
                    <div class="doc-ref">REF: BID-{bid.id}-RFQ-{rfq.id}</div>
                    <div class="doc-date">Executed on: {current_date}</div>
                </td>
            </tr>
        </table>
        
        <table class="parties-table" cellspacing="0" cellpadding="0">
            <tr>
                <td class="party-box" style="width: 48%;">
                    <div class="party-title">Shipper / Awarding Party</div>
                    <div class="party-name">{org.company_name or org.username}</div>
                    <div class="party-sub">Account: Organization</div>
                    <div class="party-sub">Contact: {org.email}</div>
                </td>
                <td class="party-spacer"></td>
                <td class="party-box vendor" style="width: 48%;">
                    <div class="party-title vendor-title">Carrier / Executing Party</div>
                    <div class="party-name vendor-name">{vendor.company_name or vendor.username}</div>
                    <div class="party-sub">Account: Verified Vendor</div>
                    <div class="party-sub">Contact: {vendor.email}</div>
                </td>
            </tr>
        </table>

        <div class="section-title">Logistics Overview & Timeline</div>
        <table class="metrics-table">
            <tr>
                <td class="metric-box">
                    <div class="metric-label">Estimated Transit</div>
                    <div class="metric-value">{bid.transit_time_days}</div>
                    <div class="metric-sub">Total Days</div>
                </td>
                <td class="metric-box">
                    <div class="metric-label">Destination Free Time</div>
                    <div class="metric-value">{bid.free_days_demurrage}</div>
                    <div class="metric-sub">Demurrage Days</div>
                </td>
                <td class="metric-box highlight">
                    <div class="metric-label">Cargo Volume</div>
                    <div class="metric-value orange">{bid.shipment.volume}x</div>
                    <div class="metric-sub">{bid.shipment.container_type}</div>
                </td>
            </tr>
        </table>

        <table class="timeline-table">
            <tr>
                <td class="timeline-node">
                    <div>{bid.shipment.origin_port}</div>
                    <div class="timeline-label">Port of Loading</div>
                </td>
                <td class="timeline-line">
                    <span style="font-size: 10px; color: #ea580c; background: #fff; padding: 0 10px; font-weight: bold;">OCEAN TRANSIT</span>
                </td>
                <td class="timeline-node">
                    <div>{bid.shipment.destination_port}</div>
                    <div class="timeline-label">Port of Discharge</div>
                </td>
            </tr>
        </table>

        <div class="section-title">Cargo Specifications</div>
        <table class="details-table">
            <tr>
                <th>Tender Reference Title</th>
                <td>{rfq.title}</td>
            </tr>
            <tr>
                <th>Routing Requirements</th>
                <td>Direct / Transshipment terms as per standard SLA</td>
            </tr>
            <tr>
                <th>Equipment Type</th>
                <td>Standard {bid.shipment.container_type} Dry Van Containers</td>
            </tr>
        </table>

        <div class="section-title">Financial Breakdown & Analytics</div>
        
        <table class="finance-chart-table">
            <tr>
                <td class="bar-base" style="width: {base_cost_pct}%;"></td>
                <td class="bar-surcharge" style="width: {surcharge_pct}%;"></td>
            </tr>
            <tr>
                <td class="legend" style="text-align: left;">■ Base Freight ({base_cost_pct}%)</td>
                <td class="legend" style="text-align: right;">■ Est. Surcharges ({surcharge_pct}%)</td>
            </tr>
        </table>

        <table class="financials-table">
            <tr>
                <th>Line Item Description</th>
                <th style="text-align: right;">Amount</th>
            </tr>
            <tr>
                <td><strong>Ocean Freight Rate</strong><br/><span style="font-size: 10px; color:#64748b;">Includes base routing from POL to POD for {bid.shipment.volume} containers.</span></td>
                <td style="text-align: right; vertical-align: top;">Included</td>
            </tr>
            <tr class="total-row">
                <td class="total-label">Total Contract Value</td>
                <td>{bid.currency} ${formatted_amount}</td>
            </tr>
        </table>
        
        <div id="footer_content">
            <div class="footer-text">
                <strong>SECURE DIGITAL AGREEMENT</strong><br>
                This document was automatically generated by the FreightOS Procurement Engine.<br>
                By executing the "Award Contract" action on the platform, both parties have digitally agreed to the terms outlined above. No further physical signature is required to commence logistics operations.<br>
                <em>Document Hash ID: {bid.id}-{rfq.id}-{current_date}</em>
            </div>
        </div>
        
    </body>
    </html>
    """
    
    result = io.BytesIO()
    pdf = pisa.pisaDocument(io.BytesIO(html_content.encode("UTF-8")), result)
    
    if not pdf.err:
        return ContentFile(result.getvalue(), name=f'FreightOS_Contract_RFQ{rfq.id}_BID{bid.id}.pdf')
    return None