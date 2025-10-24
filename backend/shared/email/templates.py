"""Email template rendering with header/footer wrapper."""
from typing import Dict, Any
from ..config import settings


def _wrap_in_layout(body_content: str) -> str:
    """
    Wrap email body content in header/footer layout.

    Args:
        body_content: The main email content (without header/footer)

    Returns:
        Complete HTML email with header and footer
    """
    logo_url = settings.logo_url or "https://via.placeholder.com/150x50?text=FlowShare"

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowShare V2</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            padding: 30px 20px;
            text-align: center;
        }}
        .header img {{
            max-width: 180px;
            height: auto;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }}
        .button {{
            display: inline-block;
            padding: 12px 30px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .button:hover {{
            background-color: #1e40af;
        }}
        .alert-box {{
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .success-box {{
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .data-table th {{
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
        }}
        .data-table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}
        h1 {{
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
        }}
        h2 {{
            color: #374151;
            font-size: 18px;
            margin-top: 30px;
            margin-bottom: 15px;
        }}
        p {{
            margin: 15px 0;
        }}
        .divider {{
            height: 1px;
            background-color: #e5e7eb;
            margin: 30px 0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="{logo_url}" alt="FlowShare V2 Logo">
        </div>

        <!-- Main Content -->
        <div class="content">
            {body_content}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>FlowShare V2</strong> - AI-Powered Hydrocarbon Allocation Platform</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>
                <a href="https://flowshare-v2.web.app" style="color: #2563eb; text-decoration: none;">Visit Dashboard</a> |
                <a href="https://flowshare-v2.web.app/help" style="color: #2563eb; text-decoration: none;">Help Center</a>
            </p>
            <p style="margin-top: 20px; font-size: 11px; color: #9ca3af;">
                &copy; 2025 FlowShare V2. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    """


def render_anomaly_alert_email(
    user_name: str,
    entry_id: str,
    partner_id: str,
    gross_volume: float,
    anomaly_score: float,
    validation_notes: str = "",
) -> str:
    """
    Render anomaly alert email (without header/footer).

    Args:
        user_name: User's full name
        entry_id: Production entry ID
        partner_id: Partner ID
        gross_volume: Gross volume value
        anomaly_score: Anomaly score (0-1)
        validation_notes: Additional validation notes

    Returns:
        Complete HTML email
    """
    body = f"""
        <h1>⚠️ Anomaly Detected in Production Data</h1>

        <p>Hello <strong>{user_name}</strong>,</p>

        <p>An anomaly has been detected in your recent production data submission by our AI validation system.</p>

        <div class="alert-box">
            <strong>Anomaly Alert</strong><br>
            This entry has been flagged and requires your review before it can be used in reconciliation.
        </div>

        <h2>Entry Details</h2>
        <table class="data-table">
            <tr>
                <th>Field</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Entry ID</td>
                <td><code>{entry_id}</code></td>
            </tr>
            <tr>
                <td>Partner ID</td>
                <td>{partner_id}</td>
            </tr>
            <tr>
                <td>Gross Volume</td>
                <td>{gross_volume:.2f} barrels</td>
            </tr>
            <tr>
                <td>Anomaly Score</td>
                <td><strong>{anomaly_score:.2%}</strong></td>
            </tr>
        </table>

        {f'<p><strong>Validation Notes:</strong> {validation_notes}</p>' if validation_notes else ''}

        <div class="divider"></div>

        <h2>What You Should Do</h2>
        <ol>
            <li>Review the flagged data entry carefully</li>
            <li>Verify the values against your source records</li>
            <li>Correct any errors or confirm the data is accurate</li>
            <li>Contact support if you need assistance</li>
        </ol>

        <a href="https://flowshare-v2.web.app/dashboard/production/{entry_id}" class="button">
            Review Entry Now
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <strong>Why was this flagged?</strong> Our AI system compares each entry against historical patterns.
            This entry showed significant deviation from your normal production levels, which may indicate a data entry error or a genuine operational change.
        </p>
    """

    return _wrap_in_layout(body)


def render_reconciliation_complete_email(
    user_name: str,
    reconciliation_id: str,
    period_start: str,
    period_end: str,
    terminal_volume: float,
    total_allocated: float,
    shrinkage_percent: float,
    partner_count: int,
    user_partner_id: str = None,
    user_allocated_volume: float = None,
) -> str:
    """
    Render reconciliation complete email (without header/footer).

    Args:
        user_name: User's full name
        reconciliation_id: Reconciliation ID
        period_start: Period start date
        period_end: Period end date
        terminal_volume: Terminal volume
        total_allocated: Total allocated volume
        shrinkage_percent: Shrinkage percentage
        partner_count: Number of partners
        user_partner_id: User's partner ID (for partner users)
        user_allocated_volume: User's allocated volume (for partner users)

    Returns:
        Complete HTML email
    """
    # Partner-specific view
    if user_partner_id and user_allocated_volume is not None:
        ownership_percent = (user_allocated_volume / terminal_volume * 100) if terminal_volume > 0 else 0

        body = f"""
            <h1>✅ Reconciliation Complete - Your Allocation</h1>

            <p>Hello <strong>{user_name}</strong>,</p>

            <p>The reconciliation for period <strong>{period_start}</strong> to <strong>{period_end}</strong> has been completed.</p>

            <div class="success-box">
                <strong>Your Allocation Summary</strong><br>
                Partner ID: {user_partner_id}
            </div>

            <h2>Your Allocation Results</h2>
            <table class="data-table">
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Terminal Volume</td>
                    <td>{terminal_volume:,.2f} bbls</td>
                </tr>
                <tr>
                    <td><strong>Your Allocated Volume</strong></td>
                    <td><strong>{user_allocated_volume:,.2f} bbls</strong></td>
                </tr>
                <tr>
                    <td>Your Ownership %</td>
                    <td>{ownership_percent:.3f}%</td>
                </tr>
                <tr>
                    <td>Total Shrinkage</td>
                    <td>{shrinkage_percent:.2f}%</td>
                </tr>
            </table>
        """
    else:
        # Coordinator view - full summary
        body = f"""
            <h1>✅ Reconciliation Complete</h1>

            <p>Hello <strong>{user_name}</strong>,</p>

            <p>The reconciliation for your joint venture has been successfully completed.</p>

            <div class="success-box">
                <strong>Reconciliation Complete</strong><br>
                All partner allocations have been calculated using API MPMS 11.1 standards.
            </div>

            <h2>Reconciliation Summary</h2>
            <table class="data-table">
                <tr>
                    <th>Field</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Reconciliation ID</td>
                    <td><code>{reconciliation_id}</code></td>
                </tr>
                <tr>
                    <td>Period</td>
                    <td>{period_start} to {period_end}</td>
                </tr>
                <tr>
                    <td>Terminal Volume</td>
                    <td>{terminal_volume:,.2f} bbls</td>
                </tr>
                <tr>
                    <td>Total Allocated</td>
                    <td>{total_allocated:,.2f} bbls</td>
                </tr>
                <tr>
                    <td>Shrinkage</td>
                    <td>{shrinkage_percent:.2f}%</td>
                </tr>
                <tr>
                    <td>Number of Partners</td>
                    <td>{partner_count}</td>
                </tr>
            </table>
        """

    body += f"""
        <div class="divider"></div>

        <h2>Next Steps</h2>
        <ul>
            <li>Review detailed allocation results in the dashboard</li>
            <li>Download the Excel audit report for verification</li>
            <li>Share results with stakeholders</li>
        </ul>

        <a href="https://flowshare-v2.web.app/dashboard/reconciliation/{reconciliation_id}" class="button">
            View Detailed Results
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            All calculations follow API MPMS 11.1 petroleum industry standards and include complete audit trails.
        </p>
    """

    return _wrap_in_layout(body)


def render_invitation_email(
    invitee_name: str,
    inviter_name: str,
    tenant_name: str,
    role: str,
    invitation_id: str,
    expires_at: str,
) -> str:
    """
    Render team invitation email (without header/footer).

    Args:
        invitee_name: Invitee's name
        inviter_name: Inviter's name
        tenant_name: Tenant/company name
        role: User role being assigned
        invitation_id: Invitation ID
        expires_at: Invitation expiration date

    Returns:
        Complete HTML email
    """
    role_display = role.replace('_', ' ').title()

    body = f"""
        <h1>🤝 You've Been Invited to FlowShare V2</h1>

        <p>Hello <strong>{invitee_name}</strong>,</p>

        <p><strong>{inviter_name}</strong> has invited you to join <strong>{tenant_name}</strong> on FlowShare V2 as a <strong>{role_display}</strong>.</p>

        <div class="success-box">
            <strong>Invitation Details</strong><br>
            Organization: {tenant_name}<br>
            Role: {role_display}<br>
            Invited by: {inviter_name}
        </div>

        <h2>About FlowShare V2</h2>
        <p>FlowShare V2 is an AI-powered hydrocarbon allocation platform that automates joint venture reconciliation, reducing the process from weeks to minutes while maintaining production-grade accuracy.</p>

        <h2>Your Role: {role_display}</h2>
        <p>As a {role_display}, you will be able to:</p>
        <ul>
            <li>Submit and manage production data</li>
            <li>View reconciliation results</li>
            <li>Access analytics and reports</li>
            <li>Collaborate with team members</li>
        </ul>

        <a href="https://flowshare-v2.web.app/invitations/{invitation_id}/accept" class="button">
            Accept Invitation
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #dc2626;">
            <strong>⏰ This invitation expires on {expires_at}</strong>
        </p>

        <div class="divider"></div>

        <p style="font-size: 14px; color: #6b7280;">
            If you did not expect this invitation or have questions, please contact {inviter_name} or our support team.
        </p>
    """

    return _wrap_in_layout(body)
