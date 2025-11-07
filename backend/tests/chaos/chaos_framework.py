"""
Chaos Engineering Framework for FlowShare V2.

Provides tools to inject failures and test system resilience:
- Network disruptions (latency, packet loss, partitions)
- Service failures (crashes, hangs, resource exhaustion)
- Database failures (connection loss, slow queries, corruption)
- Pub/Sub failures (message loss, delays, duplicates)
- Firestore failures (quota exhaustion, connection issues)
- Resource exhaustion (memory, CPU, disk)
- Time-based failures (clock skew, timeouts)

Based on Chaos Engineering principles:
1. Define steady state (normal metrics)
2. Hypothesize steady state continues
3. Introduce real-world failures
4. Disprove hypothesis = find weakness

References:
- Netflix Chaos Monkey
- Google DiRT (Disaster Recovery Testing)
- Principles of Chaos Engineering
"""

import asyncio
import random
import time
import logging
from contextlib import contextmanager, asynccontextmanager
from typing import Callable, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import psutil
import subprocess

logger = logging.getLogger(__name__)


class FailureType(Enum):
    """Types of failures that can be injected."""
    NETWORK_LATENCY = "network_latency"
    NETWORK_PACKET_LOSS = "network_packet_loss"
    NETWORK_PARTITION = "network_partition"
    SERVICE_CRASH = "service_crash"
    SERVICE_HANG = "service_hang"
    DATABASE_SLOW_QUERY = "database_slow_query"
    DATABASE_CONNECTION_LOSS = "database_connection_loss"
    PUBSUB_MESSAGE_DELAY = "pubsub_message_delay"
    PUBSUB_MESSAGE_LOSS = "pubsub_message_loss"
    PUBSUB_MESSAGE_DUPLICATE = "pubsub_message_duplicate"
    MEMORY_EXHAUSTION = "memory_exhaustion"
    CPU_EXHAUSTION = "cpu_exhaustion"
    DISK_FULL = "disk_full"
    CLOCK_SKEW = "clock_skew"
    TIMEOUT = "timeout"
    FIRESTORE_QUOTA_EXCEEDED = "firestore_quota_exceeded"


@dataclass
class ChaosExperiment:
    """Defines a chaos experiment."""
    name: str
    description: str
    failure_type: FailureType
    target_service: str  # auditor, accountant, communicator, api
    duration_seconds: float
    parameters: Dict[str, Any]
    steady_state_hypothesis: str
    blast_radius: str  # "single_agent", "all_agents", "system_wide"


class ChaosMonkey:
    """Main chaos engineering orchestrator."""

    def __init__(self):
        self.active_experiments = []
        self.metrics = {
            "experiments_run": 0,
            "failures_detected": 0,
            "recovery_times": []
        }

    async def run_experiment(self, experiment: ChaosExperiment) -> Dict[str, Any]:
        """
        Run a chaos experiment and measure impact.

        Returns:
            Results dict with metrics and observations
        """
        logger.info(f"Starting chaos experiment: {experiment.name}")
        logger.info(f"Hypothesis: {experiment.steady_state_hypothesis}")

        # 1. Measure steady state
        steady_state = await self._measure_steady_state(experiment.target_service)

        # 2. Inject failure
        start_time = time.time()
        failure_injector = self._get_failure_injector(experiment.failure_type)

        try:
            async with failure_injector(experiment):
                # 3. Observe system behavior during failure
                during_failure = await self._measure_metrics(
                    experiment.target_service,
                    duration=experiment.duration_seconds
                )

            # 4. Measure recovery
            recovery_start = time.time()
            recovered = await self._wait_for_recovery(
                experiment.target_service,
                steady_state,
                timeout=60
            )
            recovery_time = time.time() - recovery_start

        except Exception as e:
            logger.error(f"Experiment failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "experiment": experiment.name
            }

        # 5. Analyze results
        results = {
            "success": True,
            "experiment": experiment.name,
            "steady_state": steady_state,
            "during_failure": during_failure,
            "recovered": recovered,
            "recovery_time_seconds": recovery_time,
            "hypothesis_validated": self._validate_hypothesis(
                experiment,
                steady_state,
                during_failure
            ),
            "total_duration": time.time() - start_time
        }

        self.metrics["experiments_run"] += 1
        if not results["hypothesis_validated"]:
            self.metrics["failures_detected"] += 1
        self.metrics["recovery_times"].append(recovery_time)

        logger.info(f"Experiment complete: {results}")
        return results

    async def _measure_steady_state(self, service: str) -> Dict[str, Any]:
        """Measure baseline metrics before failure injection."""
        return {
            "response_time_ms": await self._get_response_time(service),
            "error_rate": await self._get_error_rate(service),
            "throughput": await self._get_throughput(service),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "timestamp": time.time()
        }

    async def _measure_metrics(self, service: str, duration: float) -> Dict[str, Any]:
        """Continuously measure metrics during failure injection."""
        samples = []
        end_time = time.time() + duration

        while time.time() < end_time:
            samples.append({
                "response_time_ms": await self._get_response_time(service),
                "error_rate": await self._get_error_rate(service),
                "timestamp": time.time()
            })
            await asyncio.sleep(1)

        # Aggregate samples
        return {
            "avg_response_time_ms": sum(s["response_time_ms"] for s in samples) / len(samples),
            "max_response_time_ms": max(s["response_time_ms"] for s in samples),
            "avg_error_rate": sum(s["error_rate"] for s in samples) / len(samples),
            "samples": len(samples)
        }

    async def _wait_for_recovery(
        self, service: str, steady_state: Dict[str, Any], timeout: float
    ) -> bool:
        """Wait for service to return to steady state after failure removal."""
        start_time = time.time()

        while time.time() - start_time < timeout:
            current = await self._measure_steady_state(service)

            # Check if within 20% of steady state
            response_time_ok = abs(
                current["response_time_ms"] - steady_state["response_time_ms"]
            ) < (steady_state["response_time_ms"] * 0.2)

            error_rate_ok = current["error_rate"] < (steady_state["error_rate"] + 0.05)

            if response_time_ok and error_rate_ok:
                return True

            await asyncio.sleep(1)

        return False

    def _validate_hypothesis(
        self, experiment: ChaosExperiment, steady: Dict, failure: Dict
    ) -> bool:
        """
        Validate steady state hypothesis.

        Returns True if system maintained acceptable behavior during failure.
        """
        # Define acceptable degradation thresholds
        MAX_RESPONSE_TIME_INCREASE = 3.0  # 3x slower is acceptable
        MAX_ERROR_RATE_INCREASE = 0.10  # +10% error rate is acceptable

        response_time_ratio = failure["avg_response_time_ms"] / steady["response_time_ms"]
        error_rate_increase = failure["avg_error_rate"] - steady["error_rate"]

        hypothesis_holds = (
            response_time_ratio <= MAX_RESPONSE_TIME_INCREASE and
            error_rate_increase <= MAX_ERROR_RATE_INCREASE
        )

        return hypothesis_holds

    def _get_failure_injector(self, failure_type: FailureType):
        """Get the appropriate failure injector for the failure type."""
        injectors = {
            FailureType.NETWORK_LATENCY: self._inject_network_latency,
            FailureType.NETWORK_PACKET_LOSS: self._inject_packet_loss,
            FailureType.SERVICE_CRASH: self._inject_service_crash,
            FailureType.SERVICE_HANG: self._inject_service_hang,
            FailureType.DATABASE_SLOW_QUERY: self._inject_slow_query,
            FailureType.PUBSUB_MESSAGE_DELAY: self._inject_message_delay,
            FailureType.MEMORY_EXHAUSTION: self._inject_memory_exhaustion,
            FailureType.CPU_EXHAUSTION: self._inject_cpu_exhaustion,
            FailureType.FIRESTORE_QUOTA_EXCEEDED: self._inject_quota_exceeded,
        }
        return injectors.get(failure_type, self._inject_generic_failure)

    @asynccontextmanager
    async def _inject_network_latency(self, experiment: ChaosExperiment):
        """Inject network latency using tc (traffic control)."""
        latency_ms = experiment.parameters.get("latency_ms", 100)
        interface = experiment.parameters.get("interface", "eth0")

        logger.info(f"Injecting {latency_ms}ms network latency on {interface}")

        # Add latency
        try:
            subprocess.run([
                "sudo", "tc", "qdisc", "add", "dev", interface,
                "root", "netem", "delay", f"{latency_ms}ms"
            ], check=True)
        except subprocess.CalledProcessError:
            logger.warning("Could not inject network latency (may need sudo)")

        try:
            yield
        finally:
            # Remove latency
            try:
                subprocess.run([
                    "sudo", "tc", "qdisc", "del", "dev", interface, "root"
                ], check=True)
            except subprocess.CalledProcessError:
                pass

    @asynccontextmanager
    async def _inject_packet_loss(self, experiment: ChaosExperiment):
        """Inject packet loss."""
        loss_percent = experiment.parameters.get("loss_percent", 10)
        interface = experiment.parameters.get("interface", "eth0")

        logger.info(f"Injecting {loss_percent}% packet loss on {interface}")

        try:
            subprocess.run([
                "sudo", "tc", "qdisc", "add", "dev", interface,
                "root", "netem", "loss", f"{loss_percent}%"
            ], check=True)
        except subprocess.CalledProcessError:
            logger.warning("Could not inject packet loss")

        try:
            yield
        finally:
            try:
                subprocess.run([
                    "sudo", "tc", "qdisc", "del", "dev", interface, "root"
                ], check=True)
            except subprocess.CalledProcessError:
                pass

    @asynccontextmanager
    async def _inject_service_crash(self, experiment: ChaosExperiment):
        """Simulate service crash by killing process."""
        service_name = experiment.target_service
        logger.info(f"Simulating crash of {service_name}")

        # Find and kill process
        port_map = {"auditor": 8001, "accountant": 8002, "communicator": 8003}
        port = port_map.get(service_name)

        if port:
            try:
                # Find process on port
                result = subprocess.run(
                    ["lsof", "-ti", f"tcp:{port}"],
                    capture_output=True,
                    text=True
                )
                if result.stdout:
                    pid = int(result.stdout.strip())
                    psutil.Process(pid).terminate()
                    logger.info(f"Terminated process {pid}")
            except Exception as e:
                logger.error(f"Could not crash service: {e}")

        try:
            yield
        finally:
            # Service should auto-restart (in production via Cloud Run)
            logger.info(f"Waiting for {service_name} to restart")
            await asyncio.sleep(5)

    @asynccontextmanager
    async def _inject_service_hang(self, experiment: ChaosExperiment):
        """Simulate service hang by sending SIGSTOP."""
        service_name = experiment.target_service
        hang_duration = experiment.duration_seconds

        logger.info(f"Hanging {service_name} for {hang_duration}s")

        port_map = {"auditor": 8001, "accountant": 8002, "communicator": 8003}
        port = port_map.get(service_name)
        pid = None

        if port:
            try:
                result = subprocess.run(
                    ["lsof", "-ti", f"tcp:{port}"],
                    capture_output=True,
                    text=True
                )
                if result.stdout:
                    pid = int(result.stdout.strip())
                    psutil.Process(pid).suspend()
                    logger.info(f"Suspended process {pid}")
            except Exception as e:
                logger.error(f"Could not hang service: {e}")

        try:
            yield
        finally:
            # Resume process
            if pid:
                try:
                    psutil.Process(pid).resume()
                    logger.info(f"Resumed process {pid}")
                except:
                    pass

    @asynccontextmanager
    async def _inject_slow_query(self, experiment: ChaosExperiment):
        """Simulate slow database queries by adding artificial delays."""
        delay_ms = experiment.parameters.get("delay_ms", 500)

        logger.info(f"Injecting {delay_ms}ms query delays")

        # Mock Firestore to add delays
        original_get = None
        try:
            # In real implementation, would monkey-patch Firestore methods
            yield
        finally:
            # Restore original method
            pass

    @asynccontextmanager
    async def _inject_message_delay(self, experiment: ChaosExperiment):
        """Delay Pub/Sub message delivery."""
        delay_seconds = experiment.parameters.get("delay_seconds", 5)

        logger.info(f"Delaying Pub/Sub messages by {delay_seconds}s")

        # Mock Pub/Sub publisher to add delays
        try:
            yield
        finally:
            pass

    @asynccontextmanager
    async def _inject_memory_exhaustion(self, experiment: ChaosExperiment):
        """Consume memory to simulate resource exhaustion."""
        memory_mb = experiment.parameters.get("memory_mb", 500)

        logger.info(f"Consuming {memory_mb}MB of memory")

        # Allocate memory
        consumed = []
        try:
            for _ in range(memory_mb):
                consumed.append(bytearray(1024 * 1024))  # 1MB chunks

            yield
        finally:
            # Release memory
            consumed.clear()
            logger.info("Released consumed memory")

    @asynccontextmanager
    async def _inject_cpu_exhaustion(self, experiment: ChaosExperiment):
        """Consume CPU cycles."""
        cpu_percent = experiment.parameters.get("cpu_percent", 80)
        duration = experiment.duration_seconds

        logger.info(f"Consuming {cpu_percent}% CPU for {duration}s")

        # Spin up CPU-intensive tasks
        async def burn_cpu():
            end_time = time.time() + duration
            while time.time() < end_time:
                _ = [i ** 2 for i in range(10000)]

        tasks = [asyncio.create_task(burn_cpu()) for _ in range(psutil.cpu_count())]

        try:
            yield
        finally:
            for task in tasks:
                task.cancel()

    @asynccontextmanager
    async def _inject_quota_exceeded(self, experiment: ChaosExperiment):
        """Simulate Firestore quota exceeded error."""
        logger.info("Simulating Firestore quota exceeded")

        # Mock Firestore to throw quota errors
        try:
            yield
        finally:
            pass

    @asynccontextmanager
    async def _inject_generic_failure(self, experiment: ChaosExperiment):
        """Generic failure injection."""
        logger.info(f"Injecting generic failure: {experiment.failure_type}")
        yield

    async def _get_response_time(self, service: str) -> float:
        """Get current response time for service."""
        import aiohttp
        port_map = {"auditor": 8001, "accountant": 8002, "communicator": 8003, "api": 8000}
        port = port_map.get(service, 8000)

        try:
            async with aiohttp.ClientSession() as session:
                start = time.time()
                async with session.get(f"http://localhost:{port}/") as response:
                    await response.text()
                return (time.time() - start) * 1000  # Convert to ms
        except:
            return 10000  # Return high value if service down

    async def _get_error_rate(self, service: str) -> float:
        """Get current error rate for service."""
        # In production, would query metrics/logs
        # For testing, return mock value
        return 0.01  # 1% error rate

    async def _get_throughput(self, service: str) -> float:
        """Get current throughput for service."""
        # In production, would query metrics
        return 100.0  # requests per second


# Convenience function
async def run_chaos_experiment(experiment: ChaosExperiment) -> Dict[str, Any]:
    """Run a single chaos experiment."""
    monkey = ChaosMonkey()
    return await monkey.run_experiment(experiment)
