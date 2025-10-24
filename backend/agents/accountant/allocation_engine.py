"""
API MPMS 11.1 Allocation Engine

Implements the allocation methodology from:
"Back Allocation Methodology and Formulas.pdf"
"""
import logging
from typing import Dict, List, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ProductionData:
    """Production data for a single partner."""

    partner_id: str
    partner_name: str
    gross_volume: float  # Barrels
    bsw_percent: float  # Basic Sediment & Water percentage
    temperature: float  # °F
    api_gravity: float  # API Gravity
    pressure: float = 14.696  # psia (default standard pressure)
    meter_factor: float = 1.0


@dataclass
class AllocationResult:
    """Allocation calculation result for a partner."""

    partner_id: str
    partner_name: str
    gross_volume: float
    bsw_percent: float

    # Step 1: Water Cut
    water_cut_factor: float
    net_volume_observed: float

    # Step 2: Temperature Correction
    observed_temperature: float
    standard_temperature: float
    temperature_correction_factor: float

    # Step 3: API Gravity Correction
    api_gravity: float
    observed_specific_gravity: float
    standard_specific_gravity: float
    api_correction_factor: float

    # Step 4: Net Standard Volume
    net_volume_standard: float

    # Step 5: Ownership Allocation
    ownership_percent: float
    allocated_volume: float

    # Intermediate calculations for audit trail
    intermediate_calculations: Dict[str, Any]


class AllocationEngine:
    """
    API MPMS 11.1 Allocation Engine.

    This engine implements the petroleum industry standard allocation methodology.
    """

    def __init__(
        self,
        temperature_standard: float = 60.0,  # °F
        pressure_standard: float = 14.696,  # psia
    ):
        self.temperature_standard = temperature_standard
        self.pressure_standard = pressure_standard

    def calculate_specific_gravity(self, api_gravity: float) -> float:
        """
        Calculate Specific Gravity from API Gravity.

        Formula: SG = 141.5 / (API + 131.5)

        Reference: API MPMS Chapter 11.1, Section 11.1.6.2
        """
        if api_gravity <= 0:
            raise ValueError("API Gravity must be greater than 0")

        sg = 141.5 / (api_gravity + 131.5)
        logger.debug(f"Specific Gravity: {sg} (API: {api_gravity})")
        return sg

    def calculate_water_cut_factor(self, bsw_percent: float) -> float:
        """
        Calculate Water Cut Factor.

        Formula: Water Cut Factor = 1 - (BSW% / 100)

        This represents the fraction of oil in the mixture.
        """
        if not 0 <= bsw_percent <= 100:
            raise ValueError("BSW% must be between 0 and 100")

        water_cut = 1.0 - (bsw_percent / 100.0)
        logger.debug(f"Water Cut Factor: {water_cut} (BSW: {bsw_percent}%)")
        return water_cut

    def calculate_net_observed_volume(self, gross_volume: float, water_cut_factor: float) -> float:
        """
        Calculate Net Observed Volume (oil only, no water/sediment).

        Formula: Net Volume = Gross Volume × Water Cut Factor
        """
        net_volume = gross_volume * water_cut_factor
        logger.debug(f"Net Observed Volume: {net_volume} bbls")
        return net_volume

    def calculate_temperature_correction(
        self, observed_temp: float, api_gravity: float
    ) -> float:
        """
        Calculate Temperature Correction Factor.

        Formula: CTL = 1 - α(T - Ts) - β(T - Ts)²

        Where:
        - T = Observed Temperature (°F)
        - Ts = Standard Temperature (60°F)
        - α, β = Temperature correction coefficients based on API gravity

        Reference: API MPMS Chapter 11.1, Table 6A/6B
        """
        delta_t = observed_temp - self.temperature_standard

        # Simplified coefficients (actual values from ASTM D1250 tables)
        # These are approximations; production systems use full lookup tables
        if api_gravity < 50:
            alpha = 0.000347  # Volume correction coefficient
            beta = 0.000002  # Second-order coefficient
        else:
            alpha = 0.000400
            beta = 0.000002

        ctl = 1.0 - (alpha * delta_t) - (beta * delta_t * delta_t)

        logger.debug(
            f"Temperature Correction: {ctl} "
            f"(T={observed_temp}°F, Ts={self.temperature_standard}°F, ΔT={delta_t})"
        )
        return ctl

    def calculate_api_correction(
        self, observed_temp: float, api_gravity: float
    ) -> float:
        """
        Calculate API Gravity Correction Factor.

        This adjusts for the density change due to temperature.

        Formula: CPL = SG_standard / SG_observed

        Where SG is calculated at standard vs observed conditions.
        """
        # For petroleum products, we use a simplified correction
        # In production, this would use ASTM D1250 Volume Correction Factors

        sg_standard = self.calculate_specific_gravity(api_gravity)

        # Approximate SG at observed temperature
        # (In reality, this uses complex tables)
        temp_effect = 1.0 + 0.0004 * (observed_temp - self.temperature_standard)
        sg_observed = sg_standard / temp_effect

        cpl = sg_standard / sg_observed

        logger.debug(
            f"API Correction: {cpl} "
            f"(SG_std={sg_standard}, SG_obs={sg_observed})"
        )
        return cpl

    def calculate_net_standard_volume(
        self,
        net_observed_volume: float,
        temperature_correction: float,
        api_correction: float,
    ) -> float:
        """
        Calculate Net Standard Volume.

        This is the volume corrected to standard conditions (60°F, 14.696 psia).

        Formula: NSV = Net Observed Volume × CTL × CPL
        """
        nsv = net_observed_volume * temperature_correction * api_correction
        logger.debug(
            f"Net Standard Volume: {nsv} bbls "
            f"(NOV={net_observed_volume}, CTL={temperature_correction}, CPL={api_correction})"
        )
        return nsv

    def allocate_volumes(
        self,
        production_data: List[ProductionData],
        terminal_volume: float,
    ) -> List[AllocationResult]:
        """
        Perform full allocation calculation for all partners.

        Steps:
        1. Calculate Net Standard Volume for each partner
        2. Sum all Net Standard Volumes
        3. Calculate ownership percentage for each partner
        4. Allocate terminal volume based on ownership percentage

        Args:
            production_data: List of production data for all partners
            terminal_volume: Final measured volume at terminal (in barrels)

        Returns:
            List of allocation results for each partner
        """
        results = []
        total_net_standard_volume = 0.0

        # Step 1-4: Calculate Net Standard Volume for each partner
        for data in production_data:
            # Step 1: Water Cut
            water_cut_factor = self.calculate_water_cut_factor(data.bsw_percent)
            net_observed = self.calculate_net_observed_volume(
                data.gross_volume, water_cut_factor
            )

            # Step 2: Temperature Correction
            temp_correction = self.calculate_temperature_correction(
                data.temperature, data.api_gravity
            )

            # Step 3: API Gravity Correction
            api_correction = self.calculate_api_correction(
                data.temperature, data.api_gravity
            )

            # Step 4: Net Standard Volume
            net_standard = self.calculate_net_standard_volume(
                net_observed, temp_correction, api_correction
            )

            total_net_standard_volume += net_standard

            # Store intermediate result
            sg_observed = self.calculate_specific_gravity(data.api_gravity)
            sg_standard = sg_observed  # Simplified for this implementation

            results.append({
                "data": data,
                "water_cut_factor": water_cut_factor,
                "net_observed": net_observed,
                "temp_correction": temp_correction,
                "api_correction": api_correction,
                "net_standard": net_standard,
                "sg_observed": sg_observed,
                "sg_standard": sg_standard,
            })

        # Step 5: Calculate Ownership and Allocate Terminal Volume
        allocation_results = []
        for result in results:
            data = result["data"]
            ownership_percent = (
                (result["net_standard"] / total_net_standard_volume * 100.0)
                if total_net_standard_volume > 0
                else 0.0
            )

            allocated_volume = terminal_volume * (ownership_percent / 100.0)

            allocation_results.append(
                AllocationResult(
                    partner_id=data.partner_id,
                    partner_name=data.partner_name,
                    gross_volume=data.gross_volume,
                    bsw_percent=data.bsw_percent,
                    water_cut_factor=result["water_cut_factor"],
                    net_volume_observed=result["net_observed"],
                    observed_temperature=data.temperature,
                    standard_temperature=self.temperature_standard,
                    temperature_correction_factor=result["temp_correction"],
                    api_gravity=data.api_gravity,
                    observed_specific_gravity=result["sg_observed"],
                    standard_specific_gravity=result["sg_standard"],
                    api_correction_factor=result["api_correction"],
                    net_volume_standard=result["net_standard"],
                    ownership_percent=ownership_percent,
                    allocated_volume=allocated_volume,
                    intermediate_calculations={
                        "water_volume": data.gross_volume - result["net_observed"],
                        "total_net_standard_volume": total_net_standard_volume,
                        "terminal_volume": terminal_volume,
                    },
                )
            )

        logger.info(
            f"Allocation complete: {len(allocation_results)} partners, "
            f"Total NSV: {total_net_standard_volume} bbls, "
            f"Terminal: {terminal_volume} bbls"
        )

        return allocation_results
