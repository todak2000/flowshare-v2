"""Email template rendering with header/footer wrapper."""
from ..config import settings

# Get app URL from settings
APP_URL = settings.app_url


def _wrap_in_layout(body_content: str) -> str:
    """
    Wrap email body content in header/footer layout.

    Uses table-based layout for maximum compatibility across email clients
    including Gmail, Outlook, Yahoo Mail, Apple Mail, etc.

    Args:
        body_content: The main email content (without header/footer)

    Returns:
        Complete HTML email with header and footer
    """
    logo_url = settings.logo_url or "https://via.placeholder.com/200x60?text=FlowShare"

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>FlowShare V2</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {{font-family: Arial, Helvetica, sans-serif !important;}}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

    <!-- Wrapper Table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <tr>
            <td style="padding: 20px 0;" align="center">

                <!-- Main Container Table -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; margin: 0 auto;">

                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <img src="{logo_url}" alt="FlowShare V2" width="180" style="display: block; max-width: 180px; height: auto; border: 0; outline: none; text-decoration: none;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider Line -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="border-bottom: 1px solid #e5e7eb; padding-bottom: 0;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px;">
                            {body_content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e5e7eb;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; font-size: 13px; color: #666666; line-height: 1.6;">
                                        <p style="margin: 0 0 10px 0;">This is an automated notification from the FlowShare V2 system.</p>
                                        <p style="margin: 0 0 20px 0; font-size: 12px; color: #999999;">
                                            &copy; 2025 FlowShare V2. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->

            </td>
        </tr>
    </table>
    <!-- End Wrapper -->

</body>
</html>"""


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
    validation_notes_html = f"""
        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #333333;">
            <strong>Validation Notes:</strong> {validation_notes}
        </p>
    """ if validation_notes else ""

    body = f"""
        <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1f2937; line-height: 1.3;">Hi {user_name},</h1>

        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            An anomaly has been detected in your recent production data submission by our AI validation system.
        </p>

        <!-- Warning Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
            <tr>
                <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #92400e;">Important:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 1.6;">
                        <li>This entry has been flagged and requires your review</li>
                        <li>It cannot be used in reconciliation until approved</li>
                        <li>Please verify the data against your source records</li>
                    </ul>
                </td>
            </tr>
        </table>

        <!-- Entry Details Table -->
        <table role="presentation" cellspacing="0" cellpadding="15" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
            <tr style="background-color: #f9fafb;">
                <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Field</td>
                <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Value</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Entry ID</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; font-family: 'Courier New', monospace; border-bottom: 1px solid #f3f4f6;">{entry_id}</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Partner ID</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{partner_id}</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Gross Volume</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{gross_volume:.2f} barrels</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280;">Anomaly Score</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #dc2626; font-weight: bold;">{anomaly_score:.2%}</td>
            </tr>
        </table>

        {validation_notes_html}

        <!-- Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
            <tr>
                <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{APP_URL}/dashboard/production/{entry_id}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">Review Entry Now</a>
                </td>
            </tr>
        </table>

        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
            If you have any questions, feel free to reach out to our team.
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
            <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1f2937; line-height: 1.3;">Hi {user_name},</h1>

            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                The reconciliation for period <strong>{period_start}</strong> to <strong>{period_end}</strong> has been completed.
            </p>

            <!-- Success Box -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                    <td style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #065f46;">Your Allocation Summary</p>
                        <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.6;">Partner ID: {user_partner_id}</p>
                    </td>
                </tr>
            </table>

            <!-- Results Table -->
            <table role="presentation" cellspacing="0" cellpadding="15" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Metric</td>
                    <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; text-align: right;">Value</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Terminal Volume</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{terminal_volume:,.2f} bbls</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Your Allocated Volume</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6;">{user_allocated_volume:,.2f} bbls</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Your Ownership %</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{ownership_percent:.3f}%</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280;">Total Shrinkage</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right;">{shrinkage_percent:.2f}%</td>
                </tr>
            </table>

            <!-- Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                    <td style="border-radius: 6px; background-color: #2563eb;">
                        <a href="{APP_URL}/dashboard/reconciliation/{reconciliation_id}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">View Detailed Results</a>
                    </td>
                </tr>
            </table>
        """
    else:
        # Coordinator view - full summary
        body = f"""
            <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1f2937; line-height: 1.3;">Hi {user_name},</h1>

            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                The reconciliation for your joint venture has been successfully completed.
            </p>

            <!-- Success Box -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                    <td style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #065f46;">Reconciliation Complete</p>
                        <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.6;">All partner allocations have been calculated using API MPMS 11.1 standards.</p>
                    </td>
                </tr>
            </table>

            <!-- Summary Table -->
            <table role="presentation" cellspacing="0" cellpadding="15" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
                <tr style="background-color: #f9fafb;">
                    <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Field</td>
                    <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; text-align: right;">Value</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Reconciliation ID</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; font-family: 'Courier New', monospace; text-align: right; border-bottom: 1px solid #f3f4f6;">{reconciliation_id}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Period</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{period_start} to {period_end}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Terminal Volume</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{terminal_volume:,.2f} bbls</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Total Allocated</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{total_allocated:,.2f} bbls</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Shrinkage</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">{shrinkage_percent:.2f}%</td>
                </tr>
                <tr>
                    <td style="padding: 12px 15px; font-size: 14px; color: #6b7280;">Number of Partners</td>
                    <td style="padding: 12px 15px; font-size: 14px; color: #111827; text-align: right;">{partner_count}</td>
                </tr>
            </table>

            <!-- Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                    <td style="border-radius: 6px; background-color: #2563eb;">
                        <a href="{APP_URL}/dashboard/reconciliation/{reconciliation_id}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">View Detailed Results</a>
                    </td>
                </tr>
            </table>
        """

    body += f"""
        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
            All calculations follow API MPMS 11.1 petroleum industry standards and include complete audit trails.
        </p>
    """

    return _wrap_in_layout(body)


def render_entry_edited_email(
    user_name: str,
    entry_id: str,
    editor_name: str,
    edit_reason: str,
    measurement_date: str,
    gross_volume: float,
    bsw_percent: float,
    temperature: float,
) -> str:
    """
    Render production entry edited email.

    Args:
        user_name: User's full name
        entry_id: Production entry ID
        editor_name: Name of coordinator who edited
        edit_reason: Reason for edit
        measurement_date: Measurement date
        gross_volume: Gross volume value
        bsw_percent: BSW percentage
        temperature: Temperature value

    Returns:
        Complete HTML email
    """
    body = f"""
        <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1f2937; line-height: 1.3;">Hi {user_name},</h1>

        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            A production entry for your organization has been updated by <strong>{editor_name}</strong>.
        </p>

        <!-- Warning Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
            <tr>
                <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #92400e;">Approval Required</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">Please review and approve this change before it can be used in reconciliation.</p>
                </td>
            </tr>
        </table>

        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #333333;">
            <strong>Edit Reason:</strong> <em>{edit_reason}</em>
        </p>

        <!-- Entry Details Table -->
        <table role="presentation" cellspacing="0" cellpadding="15" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
            <tr style="background-color: #f9fafb;">
                <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Field</td>
                <td style="padding: 12px 15px; font-weight: 600; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Value</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Entry ID</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; font-family: 'Courier New', monospace; border-bottom: 1px solid #f3f4f6;">{entry_id}</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Measurement Date</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{measurement_date}</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Gross Volume</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{gross_volume:.2f} barrels</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">BSW %</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6;">{bsw_percent:.2f}%</td>
            </tr>
            <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #6b7280;">Temperature</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #111827;">{temperature:.2f}°F</td>
            </tr>
        </table>

        <!-- Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
            <tr>
                <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{APP_URL}/dashboard/production?entry={entry_id}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">Review & Approve Entry</a>
                </td>
            </tr>
        </table>

        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
            <strong>Important:</strong> Until you approve this entry, it will not be included in any reconciliation calculations.
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
        expires_at: Invitation expiration date (ISO string or formatted)

    Returns:
        Complete HTML email wrapped in layout
    """
    role_display = role.replace('_', ' ').title()

    body = f"""
        <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1f2937; line-height: 1.3;">Hi {invitee_name},</h1>

        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            <strong>{inviter_name}</strong> has invited you to join <strong>{tenant_name}</strong> on FlowShare V2 as a <strong>{role_display}</strong>.
        </p>

        <!-- Success/Info Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
            <tr>
                <td style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #065f46;">Invitation Details</p>
                    <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.6;">
                        Organization: {tenant_name}<br>
                        Role: {role_display}<br>
                        Invited by: {inviter_name}
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            FlowShare V2 is an AI-powered hydrocarbon allocation platform that automates joint venture reconciliation,
            reducing the process from weeks to minutes while maintaining production-grade accuracy.
        </p>

        <!-- Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
            <tr>
                <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="{APP_URL}/invitation/{invitation_id}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
                </td>
            </tr>
        </table>

        <!-- Warning Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
            <tr>
                <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; font-size: 14px; color: #92400e;">
                        ⏰ This invitation expires on {expires_at}
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
            If you have any questions, feel free to reach out to our team.
        </p>
    """

    return _wrap_in_layout(body)