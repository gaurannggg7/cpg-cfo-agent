from __future__ import annotations

import importlib
import sys
import types
import unittest
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
SERVICE_DIR = Path(__file__).resolve().parent

for path in (str(REPO_ROOT), str(BACKEND_DIR), str(SERVICE_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)


class FakeCfoApp:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def invoke(self, state: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(state)
        return {
            "categorized": {"categories": {"COGS": ["software"]}, "total_by_category": {"COGS": 1200}},
            "anomalies": {"anomalies": [], "risk_level": "low", "actions": []},
            "runway": {"runway_months": 12.0, "recommendations": ["hold spend"]},
            "summary": "Brief",
        }


def _install_fake_agent_module() -> FakeCfoApp:
    fake_app = FakeCfoApp()
    fake_agent_module = types.ModuleType("agent")
    fake_agent_module.cfo_app = fake_app
    fake_agent_module.categorize_transactions = lambda state: {"categorized": {"categories": {"COGS": ["software"]}}}
    fake_agent_module.calculate_runway = lambda state: {"runway": {"runway_months": 12.0}}
    sys.modules["agent"] = fake_agent_module
    return fake_app


def _install_fake_mcp_modules() -> None:
    fake_mcp_module = types.ModuleType("mcp")
    fake_server_module = types.ModuleType("mcp.server")
    fake_fastmcp_module = types.ModuleType("mcp.server.fastmcp")

    class FakeFastMCP:
        def __init__(self, name: str) -> None:
            self.name = name
            self._tools: dict[str, Any] = {}

        def tool(self, name: str | None = None):
            def decorator(func):
                self._tools[name or func.__name__] = func
                return func

            return decorator

        def run(self, transport: str = "stdio") -> None:
            return None

    fake_fastmcp_module.FastMCP = FakeFastMCP
    fake_server_module.fastmcp = fake_fastmcp_module
    fake_mcp_module.server = fake_server_module

    sys.modules["mcp"] = fake_mcp_module
    sys.modules["mcp.server"] = fake_server_module
    sys.modules["mcp.server.fastmcp"] = fake_fastmcp_module


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        _install_fake_mcp_modules()
        _install_fake_agent_module()
        sys.modules.pop("server", None)
        cls.server = importlib.import_module("server")

    def setUp(self) -> None:
        self.fake_app = self.server.cfo_app
        self.sample_csv = "date,amount,description,category\n2026-06-01,1200.00,Software,SaaS\n2026-06-15,800.00,Freight,COGS"
        self.original_build_state = self.server._build_analysis_state

    def tearDown(self) -> None:
        self.server._build_analysis_state = self.original_build_state

    def test_tool_schemas_are_well_formed(self) -> None:
        for tool_name, schema in self.server.TOOL_SCHEMAS.items():
            with self.subTest(tool_name=tool_name):
                self.assertEqual(schema["type"], "object")
                self.assertIn("csv_data", schema["properties"])
                self.assertEqual(schema["properties"]["csv_data"]["type"], "string")
                self.assertEqual(schema["required"], ["csv_data"])
                self.assertFalse(schema["additionalProperties"])

    def test_server_initializes(self) -> None:
        self.assertIsNotNone(self.server.MCP_SERVER)
        self.assertEqual(self.server.MCP_SERVER_NAME, "cpg-cfo-agent")

    def test_analyze_transactions_uses_pipeline(self) -> None:
        self.server._build_analysis_state = lambda csv_data: {
            "csv_text": csv_data,
            "df_summary": "summary",
            "monthly_burn": 1000.0,
            "monthly_revenue": 1000.0,
            "categorized": {},
            "anomalies": {},
            "runway": {},
            "summary": "",
        }
        result = self.server.analyze_transactions(self.sample_csv)
        self.assertEqual(result["summary"], "Brief")
        self.assertEqual(result["categorized"]["total_by_category"]["COGS"], 1200)
        self.assertTrue(self.fake_app.calls)
        self.assertIn("csv_text", self.fake_app.calls[0])
        self.assertIn("monthly_revenue", self.fake_app.calls[0])

    def test_categorize_spend_returns_branch_output(self) -> None:
        self.server._build_analysis_state = lambda csv_data: {
            "csv_text": csv_data,
            "df_summary": "summary",
            "monthly_burn": 1000.0,
            "monthly_revenue": 1000.0,
            "categorized": {},
            "anomalies": {},
            "runway": {},
            "summary": "",
        }
        result = self.server.categorize_spend(self.sample_csv)
        self.assertEqual(result, {"categorized": {"categories": {"COGS": ["software"]}}})

    def test_get_runway_forecast_returns_branch_output(self) -> None:
        self.server._build_analysis_state = lambda csv_data: {
            "csv_text": csv_data,
            "df_summary": "summary",
            "monthly_burn": 1000.0,
            "monthly_revenue": 1000.0,
            "categorized": {},
            "anomalies": {},
            "runway": {},
            "summary": "",
        }
        result = self.server.get_runway_forecast(self.sample_csv)
        self.assertEqual(result, {"runway": {"runway_months": 12.0}})


if __name__ == "__main__":
    unittest.main()