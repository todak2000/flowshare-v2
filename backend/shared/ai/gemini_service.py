"""Gemini AI service for analysis and chat."""
import google.generativeai as genai
from typing import Optional, Dict, Any, List, AsyncGenerator
import asyncio
import logging
from shared.config import settings
from shared.utils.circuit_breaker import async_retry, gemini_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI."""

    def __init__(self):
        """Initialize Gemini service."""
        if not settings.gemini_api_key:
            logger.warning("Gemini API key not configured")
            return

        # Strip any trailing whitespace/newlines from API key
        api_key = settings.gemini_api_key.strip()
    
        genai.configure(api_key=api_key)
        self.pro_model = genai.GenerativeModel(settings.gemini_model)
        self.flash_model = genai.GenerativeModel(settings.gemini_flash_model)

    @async_retry(
        max_attempts=3,
        initial_delay=2.0,
        max_delay=10.0,
        exceptions=(Exception,)
    )
    async def analyze_flagged_production(
        self,
        entry_data: Dict[str, Any],
        acceptable_ranges: Dict[str, tuple],
        flagged_fields: List[str]
    ) -> str:
        """
        Analyze flagged production data and provide detailed review.

        Uses retry logic with exponential backoff and circuit breaker pattern.

        Args:
            entry_data: Production entry data
            acceptable_ranges: Dictionary of field -> (min, max) ranges
            flagged_fields: List of fields that were flagged

        Returns:
            HTML formatted analysis and recommendations

        Raises:
            CircuitBreakerError: If Gemini service circuit breaker is open
        """
        prompt = f"""You are an expert Oil & Gas production analyst. Analyze the following flagged production data entry.

**Production Entry Data:**
- Partner: {entry_data.get('partner_name', 'Unknown')}
- Date: {entry_data.get('measurement_date', 'Unknown')}
- Gross Volume: {entry_data.get('gross_volume', 0)} barrels
- API Gravity: {entry_data.get('api_gravity', 0)}°
- BSW (Basic Sediment & Water): {entry_data.get('bsw_percent', 0)}%
- Temperature: {entry_data.get('temperature', 0)}°F
- Pressure: {entry_data.get('pressure', 0)} psi

**Flagged Fields:** {', '.join(flagged_fields)}

**Acceptable Ranges:**
{chr(10).join([f'- {field}: {ranges[0]} - {ranges[1]}' for field, ranges in acceptable_ranges.items()])}

**Your Task:**
Provide a comprehensive analysis including:
1. **Issue Summary**: Brief overview of what's wrong
2. **Impact Analysis**: How these anomalies affect production quality and allocation
3. **Root Cause**: Possible reasons for the flagged values
4. **Recommendations**: Specific actionable steps to resolve the issue
5. **Risk Assessment**: Potential risks if not addressed

Format your response in clean HTML (use <h3>, <p>, <ul>, <li>, <strong>, etc.) without markdown. Be professional, detailed, and actionable. Focus on oil & gas industry best practices.
"""

        try:
            async with gemini_breaker:
                response = await asyncio.to_thread(
                    self.pro_model.generate_content, prompt
                )
                return response.text
        except CircuitBreakerError as e:
            logger.error(f"Gemini circuit breaker open: {e}")
            return "<p>AI analysis service temporarily unavailable. Please try again later.</p>"
        except Exception as e:
            logger.error(f"Error analyzing flagged production: {e}")
            raise  # Let retry decorator handle it

    @async_retry(
        max_attempts=3,
        initial_delay=2.0,
        max_delay=10.0,
        exceptions=(Exception,)
    )
    async def analyze_reconciliation(
        self,
        reconciliation_data: Dict[str, Any],
        result: Dict[str, Any]
    ) -> str:
        """
        Generate comprehensive analysis of reconciliation results.

        Uses retry logic with exponential backoff and circuit breaker pattern.

        Args:
            reconciliation_data: Reconciliation metadata
            result: Reconciliation calculation results

        Returns:
            HTML formatted comprehensive analysis

        Raises:
            CircuitBreakerError: If Gemini service circuit breaker is open
        """
        partner_allocations = result.get('partner_allocations', [])

        # Build partner summary
        partner_summary = []
        for allocation in partner_allocations:
            partner_summary.append(f"""
- **{allocation['partner_name']}**
  - Gross Volume: {allocation['gross_volume']:,.2f} barrels
  - Net Standard Volume: {allocation['net_volume_standard']:,.2f} barrels
  - BSW: {allocation['bsw_percent']:.2f}%
  - Ownership: {allocation['ownership_percent']:.2f}%
  - Allocated: {allocation['allocated_volume']:,.2f} barrels
""")

        prompt = f"""You are an expert Oil & Gas reconciliation analyst. Provide a comprehensive, insightful analysis of this reconciliation report.

**Reconciliation Overview:**
- Period: {reconciliation_data.get('period_start', '')} to {reconciliation_data.get('period_end', '')}
- Terminal Volume: {reconciliation_data.get('terminal_volume', 0):,.2f} barrels
- Total Allocated: {result.get('total_allocated_volume', 0):,.2f} barrels
- Shrinkage: {result.get('shrinkage_volume', 0):,.2f} barrels ({result.get('shrinkage_percent', 0):.2f}%)
- Allocation Model: {result.get('allocation_model_used', 'Unknown')}

**Partner Allocations:**
{chr(10).join(partner_summary)}

**Your Task:**
Provide a detailed executive analysis including:

1. **Executive Summary**: High-level overview of the reconciliation (2-3 sentences)

2. **Partner-by-Partner Analysis**: For each partner:
   - Their performance and data quality
   - How their production affects other partners' allocations
   - Specific strengths or concerns

3. **Cross-Partner Impact**: Explain how each partner's data quality (BSW%, temperature, API gravity) impacts:
   - The overall pool
   - Other partners' allocated volumes
   - The shrinkage factor

4. **Improvement Recommendations**: For each partner, provide specific actionable recommendations:
   - What they can do to improve their allocation
   - Technical or operational changes to consider
   - Data quality improvements

5. **Risk Factors & Watch Points**:
   - Patterns to monitor
   - Potential issues on the horizon
   - Market or operational risks

6. **Best Practices**:
   - Industry benchmarks comparison
   - What the top performers are doing right
   - Areas where everyone can improve

Make this analysis **engaging and insightful** - use analogies, explain the science behind the numbers, and provide actionable intelligence. Format in clean HTML (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, etc.) without markdown. Be professional but conversational.
"""

        try:
            async with gemini_breaker:
                response = await asyncio.to_thread(
                    self.pro_model.generate_content, prompt
                )
                return response.text
        except CircuitBreakerError as e:
            logger.error(f"Gemini circuit breaker open: {e}")
            return "<p>AI analysis service temporarily unavailable. Please try again later.</p>"
        except Exception as e:
            logger.error(f"Error analyzing reconciliation: {e}")
            raise  # Let retry decorator handle it

    async def chat_stream(
        self,
        message: str,
        context: Dict[str, Any],
        user_role: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses for FlowshareGPT.

        Args:
            message: User's message
            context: Production data context for the user
            user_role: User's role (partner/coordinator)
            conversation_history: Previous messages in conversation

        Yields:
            Chunks of response text
        """
        # Extract context info
        tenant_name = context.get('tenant_name', 'your organization')
        user_name = context.get('user_name', 'there')

        # Build context prompt with better formatting instructions
        context_prompt = f"""You are FlowshareGPT, an expert petroleum engineer and production analyst specializing in hydrocarbon allocation and production monitoring.

**Context:**
- User: {user_name}
- Role: {user_role.title()}
- Organization: {tenant_name}

**Available Production Data:**
"""

        # Partner Summary
        if context.get('partner_data'):
            context_prompt += f"\n**Partner Production Summary (Last 90 Days):**\n"
            for partner in context['partner_data']:
                context_prompt += f"- {partner['name']}: {partner['total_volume']:,.0f} barrels total, {partner['entry_count']} entries, {partner['approved_count']} approved, {partner['flagged_count']} flagged\n"

        # Detailed Production Entries
        if context.get('recent_entries'):
            entries = context['recent_entries']
            context_prompt += f"\n**Production Entries Dataset ({len(entries)} entries):**\n"

            # Calculate aggregate statistics
            if entries:
                total_gross = sum(e.get('gross_volume', 0) for e in entries)
                total_net = sum(e.get('net_volume', 0) for e in entries)
                bsw_values = [e.get('bsw_percent', 0) for e in entries if e.get('bsw_percent') is not None]
                temp_values = [e.get('temperature', 0) for e in entries if e.get('temperature') is not None]
                api_values = [e.get('api_gravity', 0) for e in entries if e.get('api_gravity') is not None]

                avg_bsw = sum(bsw_values) / len(bsw_values) if bsw_values else 0
                avg_temp = sum(temp_values) / len(temp_values) if temp_values else 0
                avg_api = sum(api_values) / len(api_values) if api_values else 0

                context_prompt += f"""
**Aggregate Statistics:**
- Total Gross Volume: {total_gross:,.0f} barrels
- Total Net Volume: {total_net:,.0f} barrels
- Average BSW%: {avg_bsw:.2f}%
- Average Temperature: {avg_temp:.1f}°F
- Average API Gravity: {avg_api:.1f}°
- BSW% Range: {min(bsw_values) if bsw_values else 0:.1f}% - {max(bsw_values) if bsw_values else 0:.1f}%
- Temperature Range: {min(temp_values) if temp_values else 0:.1f}°F - {max(temp_values) if temp_values else 0:.1f}°F

**Sample Recent Entries (showing key data points):**
"""
                # Show detailed sample of recent entries
                for i, entry in enumerate(entries[:10], 1):  # Show first 10 for detail
                    date = entry.get('measurement_date')
                    if hasattr(date, 'isoformat'):
                        date_str = date.isoformat()[:10]
                    elif isinstance(date, str):
                        date_str = date[:10]
                    else:
                        date_str = 'Unknown'

                    context_prompt += f"""
Entry {i} - {date_str}:
  - Gross Volume: {entry.get('gross_volume', 0):,.0f} BBL | Net Volume: {entry.get('net_volume', 0):,.0f} BBL
  - BSW%: {entry.get('bsw_percent', 0):.2f}% | Temperature: {entry.get('temperature', 0):.1f}°F | API Gravity: {entry.get('api_gravity', 0):.1f}°
  - Pressure: {entry.get('pressure', 0):.1f} psi | Meter Factor: {entry.get('meter_factor', 1.0):.4f}
  - Status: {entry.get('status', 'unknown')}
"""
                    if entry.get('validation_notes'):
                        context_prompt += f"  - Notes: {entry.get('validation_notes')}\n"

                # Mention full dataset availability
                if len(entries) > 10:
                    context_prompt += f"\n(Full dataset contains {len(entries)} entries with complete measurement data)\n"

        # Detailed Reconciliation Data
        if context.get('reconciliations'):
            reconciliations = context['reconciliations']
            context_prompt += f"\n**Reconciliation Reports ({len(reconciliations)} reports):**\n"

            for i, rec in enumerate(reconciliations[:5], 1):  # Show first 5 in detail
                try:
                    terminal_vol = float(rec.get('terminal_volume'))
                except (ValueError, TypeError):
                    terminal_vol = 0.0

                try:
                    total_allocated_vol = float(rec.get('total_allocated_volume'))
                except (ValueError, TypeError):
                    total_allocated_vol = 0.0

                try:
                    shrinkage_vol = float(rec.get('shrinkage_volume'))
                except (ValueError, TypeError):
                    shrinkage_vol = 0.0
                
                try:
                    shrinkage_pct = float(rec.get('shrinkage_percent'))
                except (ValueError, TypeError):
                    shrinkage_pct = 0.0
                # --- End of Fix ---

                # Now, use the clean variables in your f-string
                context_prompt += f"""
                    Reconciliation {i} ({rec.get('status', 'unknown')}):
                    - Period: {rec.get('period_start', 'N/A')} to {rec.get('period_end', 'N/A')}
                    - Terminal Volume: {terminal_vol:,.0f} barrels
                    - Total Allocated: {total_allocated_vol:,.0f} barrels
                    - Shrinkage: {shrinkage_vol:,.0f} barrels ({shrinkage_pct:.2f}%)
                    - Model Used: {rec.get('allocation_model', 'unknown')}
                """
                # Partner allocations if available
                if rec.get('partner_allocations'):
                    context_prompt += "  - Partner Allocations:\n"
                    for alloc in rec.get('partner_allocations', [])[:5]:  # Show top 5 partners
                        context_prompt += f"    • {alloc.get('partner_name', 'Unknown')}: {alloc.get('allocated_volume', 0):,.0f} BBL (ownership: {alloc.get('ownership_percent', 0):.2f}%)\n"

        context_prompt += f"""
**Your Expertise:**
You specialize in:
- Hydrocarbon production analysis and trend identification
- Reconciliation calculations and allocation methodologies (weighted average, pro-rata, etc.)
- Production data quality assessment (BSW%, API gravity, temperature, pressure)
- Oilfield best practices and operational optimization
- Anomaly detection and root cause analysis in production data
- Volumetric calculations and net volume adjustments
- Water cut analysis and its impact on allocation

**How to Analyze the Data:**
- Reference specific entries, dates, and values from the dataset above
- Calculate trends by comparing recent entries to older ones
- Identify outliers in BSW%, temperature, API gravity, or volumes
- Analyze reconciliation discrepancies and shrinkage patterns
- Compare partner performance using actual numbers from the data
- When users ask about production, cite specific values and dates
- Perform calculations when needed (averages, totals, percentages)
- Point out data quality issues if you see them

**Communication Guidelines:**
- Address {tenant_name} professionally, never as "tenant" or "your tenant"
- Use proper markdown formatting for readability:
  - Use headers (##) for main sections
  - Use bullet points (-) for lists
  - Use **bold** for emphasis on key metrics and numbers
  - Use line breaks between sections
  - Format numbers clearly with commas (e.g., 12,450 barrels)
  - Use tables when comparing multiple data points
- Provide specific, actionable insights grounded in petroleum engineering principles
- Always reference actual data values from the context above
- Cite specific entry numbers, dates, or reconciliation periods
- Explain technical concepts in clear, professional language
- Never use the term "AI" - you're a petroleum production analyst
- Be conversational but professional - like a senior engineer explaining to a colleague

**Data Access:**
- Partners see only their own production data
- Coordinators see all partner data for {tenant_name}
- All responses must be based on the actual production data provided above
- When you don't have specific data to answer a question, be clear about it

**Response Style:**
- Start with a direct answer or key insight
- Support with specific data points and calculations
- Provide context using petroleum engineering principles
- End with actionable recommendations when relevant
- Make every response valuable and grounded in the actual data
"""

        # Build conversation
        chat_session = self.flash_model.start_chat(history=[])

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages for context
                # Map roles: Gemini expects "user" and "model", not "assistant"
                gemini_role = "model" if msg["role"] == "assistant" else "user"
                chat_session.history.append({
                    "role": gemini_role,
                    "parts": [msg["content"]]
                })

        # Combine context and message
        full_prompt = f"{context_prompt}\n\n**User Question:** {message}"

        try:
            # Create a queue to pass chunks from thread to async generator
            import queue
            import threading

            chunk_queue = queue.Queue()
            error_container = []

            def stream_in_thread():
                """Run the blocking streaming call in a separate thread."""
                try:
                    response = chat_session.send_message(full_prompt, stream=True)
                    for chunk in response:
                        if chunk.text:
                            chunk_queue.put(chunk.text)
                    chunk_queue.put(None)  # Signal completion
                except Exception as e:
                    error_container.append(e)
                    chunk_queue.put(None)

            # Start streaming in background thread
            thread = threading.Thread(target=stream_in_thread)
            thread.start()

            # Yield chunks as they arrive
            while True:
                # Use asyncio.to_thread to avoid blocking the event loop while waiting
                chunk_text = await asyncio.to_thread(chunk_queue.get)

                if chunk_text is None:
                    break

                yield chunk_text

            # Wait for thread to complete
            await asyncio.to_thread(thread.join)

            # Check for errors
            if error_container:
                raise error_container[0]

        except Exception as e:
            logger.error(f"Error in chat stream: {e}")
            yield "I apologize, but I encountered an error. Please try again."


# Global service instance
gemini_service = GeminiService()
