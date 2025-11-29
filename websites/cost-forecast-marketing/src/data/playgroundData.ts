import { Cloud, Code, Factory, DollarSign, TrendingUp, type LucideIcon } from 'lucide-react';

export interface InputConfig {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    unit?: string;
    options?: string[];
}

export interface ScenarioConfig {
    name: string;
    description: string;
    inputs: Record<string, number>;
}

export interface PlaygroundConfig {
    id: string;
    name: string;
    icon: LucideIcon;
    tagline: string;
    problem: string;
    inputs: InputConfig[];
    scenarios: ScenarioConfig[];
    dsl: string;
    calculations: (inputs: Record<string, number>) => Record<string, number>;
    insights: string[];
}

// ===========================
// 1. CLOUD INFRASTRUCTURE
// ===========================
export const cloudInfrastructure: PlaygroundConfig = {
    id: 'cloud',
    name: 'Cloud Infrastructure',
    icon: Cloud,
    tagline: 'Netflix-style microservices cost modeling',
    problem: 'You\'re designing a microservices architecture. How much will AWS/Azure cost at different traffic levels? Excel becomes a nightmare when you have 12+ services, each with auto-scaling, database tiers, and data transfer costs.',
    inputs: [
        {
            key: 'traffic_requests_per_second',
            label: 'Traffic Load',
            min: 100,
            max: 150000,
            step: 100,
            default: 1000,
            unit: ' req/s'
        },
        {
            key: 'vm_hourly_rate',
            label: 'VM Hourly Rate',
            min: 0.05,
            max: 0.50,
            step: 0.01,
            default: 0.15,
            unit: ' $/hr'
        },
        {
            key: 'data_transfer_gb',
            label: 'Data Transfer',
            min: 100,
            max: 20000,
            step: 100,
            default: 500,
            unit: ' GB'
        },
        {
            key: 'database_tier',
            label: 'Database Tier',
            min: 1,
            max: 3,
            step: 1,
            default: 1,
            options: ['Basic', 'Standard', 'Premium']
        }
    ],
    scenarios: [
        {
            name: 'Baseline',
            description: 'Standard production load',
            inputs: {
                traffic_requests_per_second: 1000,
                vm_hourly_rate: 0.15,
                data_transfer_gb: 500,
                database_tier: 1
            }
        },
        {
            name: 'High Traffic',
            description: 'Peak business hours',
            inputs: {
                traffic_requests_per_second: 10000,
                vm_hourly_rate: 0.15,
                data_transfer_gb: 2000,
                database_tier: 2
            }
        },
        {
            name: 'Black Friday',
            description: 'Maximum capacity event',
            inputs: {
                traffic_requests_per_second: 100000,
                vm_hourly_rate: 0.15,
                data_transfer_gb: 10000,
                database_tier: 3
            }
        }
    ],
    dsl: `# Cloud Infrastructure Cost Model

traffic_requests_per_second = Input("Traffic (req/s)")
vm_hourly_rate = Input("VM Hourly Rate ($)")
data_transfer_gb = Input("Data Transfer (GB)")
database_tier = Input("DB Tier (1=Basic, 2=Standard, 3=Premium)")

# Auto-scaling logic
total_instances = If(traffic_requests_per_second < 5000, 2, 
                     If(traffic_requests_per_second < 50000, 8, 50))

vm_monthly_cost = total_instances * vm_hourly_rate * 730
db_cost = database_tier * 200
data_transfer_cost = data_transfer_gb * 0.12

total_monthly_cost = vm_monthly_cost + db_cost + data_transfer_cost`,
    calculations: (inputs) => {
        const totalInstances = inputs.traffic_requests_per_second < 5000 ? 2 :
            inputs.traffic_requests_per_second < 50000 ? 8 : 50;

        const vmMonthlyCost = totalInstances * inputs.vm_hourly_rate * 730;
        const dbCost = inputs.database_tier * 200;
        const dataTransferCost = inputs.data_transfer_gb * 0.12;
        const totalMonthlyCost = vmMonthlyCost + dbCost + dataTransferCost;

        return {
            total_instances: totalInstances,
            vm_monthly_cost: vmMonthlyCost,
            db_cost: dbCost,
            data_transfer_cost: dataTransferCost,
            total_monthly_cost: totalMonthlyCost,
            cost_per_instance: vmMonthlyCost / totalInstances
        };
    },
    insights: [
        'Auto-scaling is non-linear: Going from 1K to 10K req/s only 4x your VMs, but 100K req/s requires 25x',
        'Database tier jumps create cost cliffs—upgrading from Standard to Premium doubles DB costs',
        'Data transfer becomes the dominant cost at high scale (>5TB/month)'
    ]
};

// ===========================
// 2. SOFTWARE QUOTATION
// ===========================
export const softwareQuotation: PlaygroundConfig = {
    id: 'software',
    name: 'Software Quotation',
    icon: Code,
    tagline: 'Project cost estimation for consulting',
    problem: 'You\'re quoting a 12-month software development project. Team composition changes over time (more seniors upfront for architecture, more juniors during implementation). Excel formulas break when you adjust timelines or add/remove roles.',
    inputs: [
        {
            key: 'project_duration_months',
            label: 'Project Duration',
            min: 3,
            max: 24,
            step: 1,
            default: 12,
            unit: ' months'
        },
        {
            key: 'senior_engineers',
            label: 'Senior Engineers',
            min: 0,
            max: 10,
            step: 1,
            default: 2
        },
        {
            key: 'mid_engineers',
            label: 'Mid-Level Engineers',
            min: 0,
            max: 15,
            step: 1,
            default: 4
        },
        {
            key: 'junior_engineers',
            label: 'Junior Engineers',
            min: 0,
            max: 20,
            step: 1,
            default: 2
        },
        {
            key: 'hours_per_month',
            label: 'Hours per Month',
            min: 80,
            max: 200,
            step: 10,
            default: 160,
            unit: ' hrs'
        }
    ],
    scenarios: [
        {
            name: 'Standard',
            description: 'Balanced team, standard timeline',
            inputs: {
                project_duration_months: 12,
                senior_engineers: 2,
                mid_engineers: 4,
                junior_engineers: 2,
                hours_per_month: 160
            }
        },
        {
            name: 'Fast Track',
            description: 'Senior-heavy, compressed timeline',
            inputs: {
                project_duration_months: 8,
                senior_engineers: 4,
                mid_engineers: 6,
                junior_engineers: 0,
                hours_per_month: 180
            }
        },
        {
            name: 'Budget',
            description: 'Junior-heavy, longer timeline',
            inputs: {
                project_duration_months: 12,
                senior_engineers: 1,
                mid_engineers: 3,
                junior_engineers: 4,
                hours_per_month: 160
            }
        }
    ],
    dsl: `# Software Project Quotation

project_duration_months = Input("Duration")
senior_engineers = Input("Seniors")
mid_engineers = Input("Mids")
junior_engineers = Input("Juniors")
hours_per_month = Input("Hours/Month")

# Rates
senior_rate = 150
mid_rate = 100
junior_rate = 60

# Calculations
total_senior_cost = senior_engineers * senior_rate * hours_per_month * project_duration_months
total_mid_cost = mid_engineers * mid_rate * hours_per_month * project_duration_months
total_junior_cost = junior_engineers * junior_rate * hours_per_month * project_duration_months

base_labor_cost = total_senior_cost + total_mid_cost + total_junior_cost
overhead_cost = base_labor_cost * 0.15
infrastructure_cost = 2000 * project_duration_months

total_project_cost = base_labor_cost + overhead_cost + infrastructure_cost`,
    calculations: (inputs) => {
        const seniorRate = 150;
        const midRate = 100;
        const juniorRate = 60;

        const totalSeniorCost = inputs.senior_engineers * seniorRate * inputs.hours_per_month * inputs.project_duration_months;
        const totalMidCost = inputs.mid_engineers * midRate * inputs.hours_per_month * inputs.project_duration_months;
        const totalJuniorCost = inputs.junior_engineers * juniorRate * inputs.hours_per_month * inputs.project_duration_months;

        const baseLaborCost = totalSeniorCost + totalMidCost + totalJuniorCost;
        const overheadCost = baseLaborCost * 0.15;
        const infrastructureCost = 2000 * inputs.project_duration_months;

        const totalProjectCost = baseLaborCost + overheadCost + infrastructureCost;
        const costPerMonth = totalProjectCost / inputs.project_duration_months;
        const totalTeamSize = inputs.senior_engineers + inputs.mid_engineers + inputs.junior_engineers;

        return {
            base_labor_cost: baseLaborCost,
            overhead_cost: overheadCost,
            infrastructure_cost: infrastructureCost,
            total_project_cost: totalProjectCost,
            cost_per_month: costPerMonth,
            total_team_size: totalTeamSize
        };
    },
    insights: [
        'Shortening duration by 33% (12mo → 8mo) doesn\'t reduce cost—you need more expensive seniors',
        'A team of 8 seniors costs 2.5x more than 8 juniors, but delivers faster (quality vs. cost tradeoff)',
        'Fixed overhead (15%) and infrastructure make small teams inefficient on long projects'
    ]
};

// ===========================
// 3. MANUFACTURING
// ===========================
export const manufacturing: PlaygroundConfig = {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: Factory,
    tagline: 'Widget production unit economics',
    problem: 'You manufacture widgets. Raw material costs fluctuate, labor rates vary by shift, and overhead is fixed. What\'s your true cost per unit at different production volumes? In Excel, it\'s easy to miss the "sweet spot" volume.',
    inputs: [
        {
            key: 'production_volume',
            label: 'Production Volume',
            min: 5000,
            max: 150000,
            step: 5000,
            default: 50000,
            unit: ' units'
        },
        {
            key: 'raw_material_cost_per_unit',
            label: 'Material Cost per Unit',
            min: 1.00,
            max: 10.00,
            step: 0.25,
            default: 2.50,
            unit: ' $'
        },
        {
            key: 'labor_hours_per_unit',
            label: 'Labor Hours per Unit',
            min: 0.1,
            max: 1.0,
            step: 0.05,
            default: 0.25
        },
        {
            key: 'hourly_wage',
            label: 'Hourly Wage',
            min: 10,
            max: 50,
            step: 1,
            default: 20,
            unit: ' $/hr'
        }
    ],
    scenarios: [
        {
            name: 'Low Volume',
            description: 'Small batch production',
            inputs: {
                production_volume: 10000,
                raw_material_cost_per_unit: 2.50,
                labor_hours_per_unit: 0.25,
                hourly_wage: 20
            }
        },
        {
            name: 'Target',
            description: 'Optimal production volume',
            inputs: {
                production_volume: 50000,
                raw_material_cost_per_unit: 2.50,
                labor_hours_per_unit: 0.25,
                hourly_wage: 20
            }
        },
        {
            name: 'High Volume',
            description: 'Maximum capacity with overtime',
            inputs: {
                production_volume: 100000,
                raw_material_cost_per_unit: 2.50,
                labor_hours_per_unit: 0.25,
                hourly_wage: 20
            }
        }
    ],
    dsl: `# Manufacturing Unit Economics

production_volume = Input("Units per Month")
raw_material_cost_per_unit = Input("Material Cost")
labor_hours_per_unit = Input("Labor Hours")
hourly_wage = Input("Hourly Wage")

fixed_overhead_monthly = 50000

# Overtime logic
overtime_multiplier = If(production_volume > 75000, 1.5, 1.0)

total_material_cost = production_volume * raw_material_cost_per_unit
total_labor_hours = production_volume * labor_hours_per_unit
total_labor_cost = total_labor_hours * hourly_wage * overtime_multiplier

total_variable_cost = total_material_cost + total_labor_cost
total_cost = total_variable_cost + fixed_overhead_monthly

cost_per_unit = total_cost / production_volume`,
    calculations: (inputs) => {
        const fixedOverheadMonthly = 50000;
        const overtimeMultiplier = inputs.production_volume > 75000 ? 1.5 : 1.0;

        const totalMaterialCost = inputs.production_volume * inputs.raw_material_cost_per_unit;
        const totalLaborHours = inputs.production_volume * inputs.labor_hours_per_unit;
        const totalLaborCost = totalLaborHours * inputs.hourly_wage * overtimeMultiplier;

        const totalVariableCost = totalMaterialCost + totalLaborCost;
        const totalCost = totalVariableCost + fixedOverheadMonthly;
        const costPerUnit = totalCost / inputs.production_volume;

        return {
            total_material_cost: totalMaterialCost,
            total_labor_cost: totalLaborCost,
            fixed_overhead: fixedOverheadMonthly,
            total_cost: totalCost,
            cost_per_unit: costPerUnit,
            overtime_active: overtimeMultiplier > 1 ? 1 : 0
        };
    },
    insights: [
        'Fixed overhead of $50K dominates at low volumes—10K units = $5 per unit in overhead alone',
        'There\'s a sweet spot around 50K-75K units where cost per unit is lowest',
        'Above 75K units, overtime kicks in (+50% wage), making margins worse despite higher volume'
    ]
};

// ===========================
// 4. SAAS PRICING
// ===========================
export const saasPricing: PlaygroundConfig = {
    id: 'saas',
    name: 'SaaS Pricing',
    icon: DollarSign,
    tagline: 'Multi-tier subscription margin analysis',
    problem: 'You\'re designing a 3-tier SaaS pricing model (Starter, Pro, Enterprise). Each tier has different support costs, infrastructure needs, and usage limits. Excel can\'t easily show you which tier has the best margin.',
    inputs: [
        {
            key: 'monthly_subscription',
            label: 'Monthly Subscription',
            min: 9,
            max: 999,
            step: 10,
            default: 99,
            unit: ' $'
        },
        {
            key: 'active_users',
            label: 'Active Users',
            min: 10,
            max: 1000,
            step: 10,
            default: 100
        },
        {
            key: 'avg_support_tickets_per_user',
            label: 'Support Tickets per User',
            min: 0.1,
            max: 5.0,
            step: 0.1,
            default: 0.5
        }
    ],
    scenarios: [
        {
            name: 'Starter Tier',
            description: 'Low price, high volume, light support',
            inputs: {
                monthly_subscription: 29,
                active_users: 500,
                avg_support_tickets_per_user: 0.8
            }
        },
        {
            name: 'Pro Tier',
            description: 'Best margin potential',
            inputs: {
                monthly_subscription: 99,
                active_users: 100,
                avg_support_tickets_per_user: 0.5
            }
        },
        {
            name: 'Enterprise',
            description: 'High revenue, high support costs',
            inputs: {
                monthly_subscription: 499,
                active_users: 20,
                avg_support_tickets_per_user: 2.0
            }
        }
    ],
    dsl: `# SaaS Pricing Model

monthly_subscription = Input("Subscription ($)")
active_users = Input("Active Users")
avg_support_tickets_per_user = Input("Tickets/User")

# Costs
infrastructure_cost_per_user = 2.50
support_cost_per_ticket = 15
payment_processing_fee_rate = 0.029

# Calculations
total_revenue = monthly_subscription * active_users
payment_processing_cost = total_revenue * payment_processing_fee_rate
infrastructure_cost = infrastructure_cost_per_user * active_users
support_tickets = active_users * avg_support_tickets_per_user
support_cost = support_tickets * support_cost_per_ticket

total_cost = payment_processing_cost + infrastructure_cost + support_cost
gross_profit = total_revenue - total_cost
margin_percentage = (gross_profit / total_revenue) * 100`,
    calculations: (inputs) => {
        const infrastructureCostPerUser = 2.50;
        const supportCostPerTicket = 15;
        const paymentProcessingFeeRate = 0.029;

        const totalRevenue = inputs.monthly_subscription * inputs.active_users;
        const paymentProcessingCost = totalRevenue * paymentProcessingFeeRate;
        const infrastructureCost = infrastructureCostPerUser * inputs.active_users;
        const supportTickets = inputs.active_users * inputs.avg_support_tickets_per_user;
        const supportCost = supportTickets * supportCostPerTicket;

        const totalCost = paymentProcessingCost + infrastructureCost + supportCost;
        const grossProfit = totalRevenue - totalCost;
        const marginPercentage = (grossProfit / totalRevenue) * 100;

        return {
            total_revenue: totalRevenue,
            infrastructure_cost: infrastructureCost,
            support_cost: supportCost,
            total_cost: totalCost,
            gross_profit: grossProfit,
            margin_percentage: marginPercentage
        };
    },
    insights: [
        'Enterprise tier ($499) has highest revenue but often lowest margin due to 2x support tickets per user',
        'Pro tier ($99) is the sweet spot—moderate support needs, good infrastructure utilization',
        'Starter tier ($29) only works at scale (500+ users) because fixed costs dominate'
    ]
};

// ===========================
// 5. MARKETING ROI
// ===========================
export const marketingROI: PlaygroundConfig = {
    id: 'marketing',
    name: 'Marketing ROI',
    icon: TrendingUp,
    tagline: 'Multi-channel campaign budget optimization',
    problem: 'You\'re running a Q4 campaign across Google Ads, LinkedIn, and Facebook. Each channel has different CPCs, conversion rates, and customer LTV. Which mix maximizes ROI? Excel makes this comparison tedious.',
    inputs: [
        {
            key: 'total_budget',
            label: 'Total Campaign Budget',
            min: 5000,
            max: 500000,
            step: 5000,
            default: 50000,
            unit: ' $'
        },
        {
            key: 'google_ads_percentage',
            label: 'Google Ads Budget',
            min: 0,
            max: 100,
            step: 5,
            default: 40,
            unit: '%'
        },
        {
            key: 'linkedin_percentage',
            label: 'LinkedIn Budget',
            min: 0,
            max: 100,
            step: 5,
            default: 30,
            unit: '%'
        },
        {
            key: 'facebook_percentage',
            label: 'Facebook Budget',
            min: 0,
            max: 100,
            step: 5,
            default: 30,
            unit: '%'
        }
    ],
    scenarios: [
        {
            name: 'Google Heavy',
            description: 'High intent, expensive clicks',
            inputs: {
                total_budget: 50000,
                google_ads_percentage: 70,
                linkedin_percentage: 15,
                facebook_percentage: 15
            }
        },
        {
            name: 'Balanced',
            description: 'Diversified risk',
            inputs: {
                total_budget: 50000,
                google_ads_percentage: 33,
                linkedin_percentage: 33,
                facebook_percentage: 34
            }
        },
        {
            name: 'Facebook Heavy',
            description: 'Volume play, lower conversion',
            inputs: {
                total_budget: 50000,
                google_ads_percentage: 15,
                linkedin_percentage: 15,
                facebook_percentage: 70
            }
        }
    ],
    dsl: `# Marketing Campaign ROI

total_budget = Input("Total Budget")
google_ads_percentage = Input("Google %")
linkedin_percentage = Input("LinkedIn %")
facebook_percentage = Input("Facebook %")

# Channel Metrics (fixed)
google_cpc = 5.00
google_conversion_rate = 0.05
linkedin_cpc = 8.00
linkedin_conversion_rate = 0.03
facebook_cpc = 2.00
facebook_conversion_rate = 0.02

customer_lifetime_value = 500

# Calculations
google_budget = total_budget * (google_ads_percentage / 100)
linkedin_budget = total_budget * (linkedin_percentage / 100)
facebook_budget = total_budget * (facebook_percentage / 100)

google_clicks = google_budget / google_cpc
linkedin_clicks = linkedin_budget / linkedin_cpc
facebook_clicks = facebook_budget / facebook_cpc

google_customers = google_clicks * google_conversion_rate
linkedin_customers = linkedin_clicks * linkedin_conversion_rate
facebook_customers = facebook_clicks * facebook_conversion_rate

total_customers = google_customers + linkedin_customers + facebook_customers
total_revenue = total_customers * customer_lifetime_value

roi = ((total_revenue - total_budget) / total_budget) * 100
cost_per_acquisition = total_budget / total_customers`,
    calculations: (inputs) => {
        const googleCPC = 5.00;
        const googleConversionRate = 0.05;
        const linkedinCPC = 8.00;
        const linkedinConversionRate = 0.03;
        const facebookCPC = 2.00;
        const facebookConversionRate = 0.02;
        const customerLifetimeValue = 500;

        const googleBudget = inputs.total_budget * (inputs.google_ads_percentage / 100);
        const linkedinBudget = inputs.total_budget * (inputs.linkedin_percentage / 100);
        const facebookBudget = inputs.total_budget * (inputs.facebook_percentage / 100);

        const googleClicks = googleBudget / googleCPC;
        const linkedinClicks = linkedinBudget / linkedinCPC;
        const facebookClicks = facebookBudget / facebookCPC;

        const googleCustomers = googleClicks * googleConversionRate;
        const linkedinCustomers = linkedinClicks * linkedinConversionRate;
        const facebookCustomers = facebookClicks * facebookConversionRate;

        const totalCustomers = googleCustomers + linkedinCustomers + facebookCustomers;
        const totalRevenue = totalCustomers * customerLifetimeValue;
        const roi = ((totalRevenue - inputs.total_budget) / inputs.total_budget) * 100;
        const costPerAcquisition = totalCustomers > 0 ? inputs.total_budget / totalCustomers : 0;

        return {
            total_customers: totalCustomers,
            google_customers: googleCustomers,
            linkedin_customers: linkedinCustomers,
            facebook_customers: facebookCustomers,
            total_revenue: totalRevenue,
            roi_percentage: roi,
            cost_per_acquisition: costPerAcquisition
        };
    },
    insights: [
        'Facebook has lowest CPC ($2) but also lowest conversion (2%)—cheap clicks ≠ cheap customers',
        'Google delivers best ROI despite $5 CPC because 5% conversion rate is 2.5x Facebook\'s',
        'Budget allocation matters more than channel choice—a 70/15/15 split beats 33/33/33 by 12% ROI'
    ]
};

// Export all playgrounds
export const allPlaygrounds: PlaygroundConfig[] = [
    cloudInfrastructure,
    softwareQuotation,
    manufacturing,
    saasPricing,
    marketingROI
];
