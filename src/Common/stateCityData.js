/** Shared dummy state → city options for forms across the app */

export const STATE_CITY_MAP = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
    Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
    Delhi: ['New Delhi', 'Delhi', 'Dwarka', 'Rohini'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    Haryana: ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
    Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
    Punjab: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    Telangana: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad'],
    'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'],
}

export const STATE_OPTIONS = Object.keys(STATE_CITY_MAP).sort()

export const getCitiesByState = (state) => STATE_CITY_MAP[state] ?? []
