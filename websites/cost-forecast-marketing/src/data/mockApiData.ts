// Mock API responses for Case Study demos
// This data comes from actual backend API responses
// Allows demos to work without a running backend server

export const MOCK_SCENARIO_RESPONSE = {
    "results": {
        "Baseline": {
            "results": {
                "energy_price_index": 100,
                "logistics_base_rate": 50,
                "raw_material_cost": 200,
                "labor_cost": 80,
                "energy_factor": 0.15,
                "logistics_cost": 50,
                "energy_surcharge": 0,
                "total_unit_cost": 330
            },
            "graph": null
        },
        "Optimistic": {
            "results": {
                "energy_price_index": 85,
                "logistics_base_rate": 45,
                "raw_material_cost": 180,
                "labor_cost": 75,
                "energy_factor": 0.15,
                "logistics_cost": 41.625,
                "energy_surcharge": -2.25,
                "total_unit_cost": 294.375
            },
            "graph": null
        },
        "Pessimistic": {
            "results": {
                "energy_price_index": 130,
                "logistics_base_rate": 60,
                "raw_material_cost": 230,
                "labor_cost": 90,
                "energy_factor": 0.15,
                "logistics_cost": 69,
                "energy_surcharge": 4.5,
                "total_unit_cost": 393.5
            },
            "graph": null
        }
    },
    "errors": []
};

export const MOCK_SENSITIVITY_RESPONSE = {
    "series": [],
    "keyDrivers": [
        {
            "inputName": "Logistics Base Rate",
            "impactScore": 2.1515151515151514,
            "outputImpacts": {
                "energy_price_index": 0,
                "logistics_base_rate": 1,
                "raw_material_cost": 0,
                "labor_cost": 0,
                "energy_factor": 0,
                "logistics_cost": 1,
                "total_unit_cost": 0.15151515151515152
            }
        },
        {
            "inputName": "Energy Price Index",
            "impactScore": 1.621212121212122,
            "outputImpacts": {
                "energy_price_index": 1,
                "logistics_base_rate": 0,
                "raw_material_cost": 0,
                "labor_cost": 0,
                "energy_factor": 0,
                "logistics_cost": 0.5000000000000007,
                "total_unit_cost": 0.12121212121212122
            }
        },
        {
            "inputName": "Raw Material Cost",
            "impactScore": 1.606060606060606,
            "outputImpacts": {
                "energy_price_index": 0,
                "logistics_base_rate": 0,
                "raw_material_cost": 1,
                "labor_cost": 0,
                "energy_factor": 0,
                "logistics_cost": 0,
                "total_unit_cost": 0.6060606060606061
            }
        },
        {
            "inputName": "Labor Cost",
            "impactScore": 1.2424242424242424,
            "outputImpacts": {
                "energy_price_index": 0,
                "logistics_base_rate": 0,
                "raw_material_cost": 0,
                "labor_cost": 1,
                "energy_factor": 0,
                "logistics_cost": 0,
                "total_unit_cost": 0.24242424242424243
            }
        }
    ],
    "errors": []
};
