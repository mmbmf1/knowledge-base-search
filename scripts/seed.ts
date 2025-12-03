/**
 * Seed script for populating the database with sample ISP troubleshooting scenarios
 *
 * This script demonstrates the seed data format for MSR/FTTH scenarios.
 * To customize for a different ISP, replace the scenarios array below with
 * your own scenario data following the same structure:
 *
 * { title: string, description: string }
 *
 * The script will automatically generate embeddings and insert them into the database.
 */

import { generateEmbedding } from '../lib/embeddings'
import { insertScenario, insertResolution, closePool, pool } from '../lib/db'

// Sample MSR/FTTH troubleshooting scenarios
// Structure: { title: string, description: string }
// This format is easily replaceable for different ISP types
const scenarios = [
  {
    title: 'Router Power Light is Red',
    description:
      "The router's power indicator light is showing red. This typically indicates a hardware failure, power supply issue, or the router is in a failed state. Check power connections, try unplugging and replugging the power adapter, and verify the power adapter is functioning correctly.",
  },
  {
    title: 'Router Internet Light is Orange/Amber',
    description:
      "The internet/WAN light on the router is showing orange or amber color instead of green. This usually means the router is attempting to establish a connection but cannot authenticate or sync with the ISP's network. Check for service outages, verify account status, and ensure all cables are properly connected.",
  },
  {
    title: 'No Internet Connection',
    description:
      'User reports complete loss of internet connectivity. All devices are unable to access the internet. Check router status lights, verify cable connections, restart the router, and check for any service outages in the area. May require ISP authentication reset.',
  },
  {
    title: 'Slow Internet Speeds',
    description:
      'Internet connection is working but speeds are significantly slower than expected. Users experiencing slow download/upload speeds, buffering, or high latency. Check for bandwidth congestion, verify service plan limits, test with wired connection, and check for background processes consuming bandwidth.',
  },
  {
    title: 'Authentication Failure',
    description:
      'Router cannot authenticate with ISP network. Connection attempts are being rejected. This may indicate incorrect credentials, account suspension, or MAC address issues. Verify account status, check for credential changes, and may require MAC address registration or account reactivation.',
  },
  {
    title: 'Ethernet Port Not Working',
    description:
      'One or more Ethernet ports on the router are not functioning. Devices connected via Ethernet cable cannot establish a connection. Check cable integrity, try different ports, verify port status in router settings, and check for physical damage to the port.',
  },
  {
    title: 'WiFi Signal is Weak',
    description:
      'Wireless signal strength is poor, causing intermittent connections or slow speeds. Users experiencing dropped connections or weak signal in certain areas. Check router placement, reduce interference from other devices, adjust antenna position, and consider WiFi extender or mesh network solution.',
  },
  {
    title: 'Router Keeps Restarting',
    description:
      'Router continuously reboots or restarts on its own. Device powers on, runs for a short period, then restarts in a loop. This may indicate overheating, power supply issues, firmware corruption, or hardware failure. Check temperature, verify power supply stability, and may require firmware reset or hardware replacement.',
  },
  {
    title: 'Fiber Optic Cable Damage',
    description:
      'Physical damage to the fiber optic cable connecting to the ONT (Optical Network Terminal). Visible damage to the cable, bent or kinked fiber, or broken connector. Fiber cables are sensitive and any damage can cause complete service loss. Requires professional repair or replacement of the fiber cable.',
  },
  {
    title: 'ONT Power Light Off',
    description:
      'The Optical Network Terminal (ONT) power indicator is off or not lit. The ONT is not receiving power or has failed. Check power connections, verify power adapter is plugged in and functioning, check for power outlet issues, and verify ONT is not in a failed state requiring replacement.',
  },
  {
    title: 'Cannot Access Router Admin Panel',
    description:
      'User unable to access router configuration interface via web browser. Connection attempts to router IP address fail or timeout. Verify correct IP address, check network connection, ensure router is powered on, try different browser, and may require factory reset if credentials are unknown.',
  },
  {
    title: 'DNS Resolution Issues',
    description:
      "Internet connection works but websites cannot be resolved. Browser shows 'DNS server not responding' or similar errors. Can access sites by IP address but not by domain name. Check DNS settings, try alternative DNS servers (8.8.8.8, 1.1.1.1), flush DNS cache, and verify router DNS configuration.",
  },
  {
    title: 'Port Forwarding Not Working',
    description:
      "Port forwarding rules configured in router are not functioning. Applications or services requiring port forwarding cannot be accessed from outside the network. Verify port forwarding rules are correctly configured, check firewall settings, ensure external IP hasn't changed, and verify service is running on correct port.",
  },
  {
    title: 'Multiple Devices Cannot Connect',
    description:
      'Several devices are unable to connect to the network simultaneously. Some devices connect while others fail, or connection limit appears to be reached. Check router device limit settings, verify DHCP pool size, check for IP conflicts, and ensure router can handle the number of connected devices.',
  },
  {
    title: 'Service Intermittent - Works Then Drops',
    description:
      'Internet connection works for a period then drops, reconnects, and repeats. Connection is unstable with frequent disconnections. Check for loose cable connections, verify signal quality, check for interference, monitor router logs for errors, and verify service stability from ISP side.',
  },
  {
    title: 'WiFi Password Not Working',
    description:
      'User cannot connect to WiFi network even with correct password. Connection attempts fail or password is rejected. Verify correct password, check for caps lock, ensure device supports WiFi security protocol, try forgetting and reconnecting to network, and check router WiFi settings.',
  },
  {
    title: 'Router Firmware Update Failed',
    description:
      'Router firmware update process failed or router is stuck in update mode. Router may be unresponsive or showing error during update. Do not power off router during update, wait for update to complete, if stuck try power cycle, check router admin for update status, and may require factory reset if update corrupted.',
  },
  {
    title: 'Cannot Connect to Specific Websites',
    description:
      'Some websites load fine but others do not load or timeout. Specific sites are inaccessible while general internet works. Check if issue is site-specific or widespread, try different browser, clear browser cache, check firewall or parental controls, verify DNS settings, and test from different network.',
  },
  {
    title: 'Router Overheating',
    description:
      'Router feels hot to touch or shuts down due to overheating. Device is physically hot and may restart or disconnect. Ensure router has adequate ventilation, remove any objects blocking vents, place router in cooler location, check for dust buildup, and verify fan is working if router has one.',
  },
  {
    title: 'IP Address Conflict',
    description:
      'Network error indicating IP address conflict. Multiple devices trying to use same IP address. Check router DHCP settings, restart router to reassign IPs, disconnect and reconnect devices, check for devices with static IPs causing conflicts, and verify DHCP pool size is adequate.',
  },
  {
    title: 'Parental Controls Blocking Access',
    description:
      'Legitimate websites or services are blocked by parental control or content filtering. Access denied to websites that should be available. Check router parental control settings, verify time restrictions, review blocked site lists, check if device is in restricted profile, and adjust filtering levels if needed.',
  },
  {
    title: 'Guest Network Not Working',
    description:
      'Guest WiFi network is enabled but devices cannot connect or access internet. Guest network appears but connection fails. Verify guest network is enabled in router settings, check guest network password, ensure guest network has internet access enabled, check device limit on guest network, and restart router if needed.',
  },
  {
    title: 'Router Time Settings Incorrect',
    description:
      'Router shows wrong time or date, affecting scheduled features and logs. Time-based features not working correctly. Access router admin panel, navigate to time settings, enable automatic time sync (NTP), select correct timezone, or manually set time if NTP unavailable, and save settings.',
  },
  {
    title: 'QoS Settings Causing Issues',
    description:
      'Quality of Service settings are prioritizing traffic incorrectly or causing slowdowns. Certain devices or applications experiencing poor performance. Access router QoS settings, review priority rules, temporarily disable QoS to test, adjust bandwidth allocation, and ensure rules match actual usage patterns.',
  },
  {
    title: 'Account Suspended or Past Due',
    description:
      'Internet service has been suspended due to account issues such as past due balance, payment failure, or account verification needed. Service is completely disconnected and account status needs to be resolved. Check account balance and payment status, verify payment method is valid, contact billing department, resolve any outstanding issues, and request service restoration.',
  },
  {
    title: 'Router Needs Factory Reset',
    description:
      'Router requires factory reset to resolve configuration issues or restore to default settings. All custom settings will be lost. Identify reset button location, perform reset procedure, wait for router to reboot, access router with default credentials, reconfigure basic settings, and restore internet connection.',
  },
  {
    title: 'Fiber Optic Light Levels Low',
    description:
      'Fiber optic connection showing low light levels or signal strength warnings. ONT or router indicating poor fiber signal quality. Check fiber cable connections for tightness, inspect for bends or kinks in cable, verify fiber connector is clean and undamaged, check ONT status lights, and contact ISP for professional signal level testing.',
  },
  {
    title: 'VPN Not Working Through Router',
    description:
      'VPN connections fail when routing through the router but work on other networks. VPN cannot establish connection or drops frequently. Check router firewall settings for VPN blocking, verify VPN ports are not blocked, try connecting VPN directly to device bypassing router, check router firmware for VPN passthrough support, and configure port forwarding if needed.',
  },
  {
    title: 'Router WPS Button Not Working',
    description:
      'WiFi Protected Setup (WPS) feature is not functioning or devices cannot connect via WPS. WPS button does not respond or connection fails. Verify WPS is enabled in router settings, check if WPS is locked due to security, try alternative connection method, ensure device supports WPS, wait for WPS lockout to expire, and use manual WiFi password entry instead.',
  },
  {
    title: 'Bandwidth Usage Exceeding Limits',
    description:
      'Internet usage has exceeded monthly data cap or bandwidth limits, resulting in throttled speeds or service restrictions. Check data usage in account portal, identify high-bandwidth applications, set up usage alerts, optimize streaming quality settings, schedule large downloads for off-peak hours, and consider upgrading service plan if consistently exceeding limits.',
  },
  {
    title: 'Router MAC Address Filtering Issues',
    description:
      'Devices cannot connect due to MAC address filtering enabled on router. Only whitelisted devices can access network. Access router admin panel, navigate to MAC filtering settings, verify device MAC addresses are in allowed list, add device MAC address to whitelist, or temporarily disable MAC filtering to test, and ensure filtering rules are correct.',
  },
  {
    title: 'UPnP Not Working',
    description:
      'Universal Plug and Play feature is not functioning, preventing automatic port configuration for applications. Applications requiring automatic port mapping are failing. Access router settings, verify UPnP is enabled, check router logs for UPnP errors, restart router to refresh UPnP service, update router firmware if available, and manually configure port forwarding as alternative.',
  },
  {
    title: 'Router Bridge Mode Issues',
    description:
      'Router configured in bridge mode is not functioning correctly or devices cannot connect. Bridge mode configuration problems or network not accessible. Verify bridge mode is correctly configured, check that another router is handling DHCP, ensure proper cable connections, verify IP addressing scheme, check for IP conflicts, and test with bridge mode disabled to isolate issue.',
  },
  {
    title: 'Billing Question - Unclear Charges',
    description:
      'Customer is confused about charges on their bill or wants to understand what specific line items mean. Customer sees unfamiliar charges, wants breakdown of fees, or questions service charges. Review account billing history, explain each charge line by line, clarify service fees and taxes, provide billing statement breakdown, and offer to send detailed invoice via email.',
  },
  {
    title: 'Request Service Upgrade',
    description:
      'Customer wants to upgrade their internet service plan to higher speeds or additional features. Customer is experiencing slow speeds, needs more bandwidth, or wants premium service tier. Check current plan details, explain available upgrade options, compare speed tiers and pricing, discuss contract terms if applicable, and process upgrade request.',
  },
  {
    title: 'Request Service Downgrade',
    description:
      'Customer wants to downgrade to a lower service tier or reduce their plan. Customer wants to save money, feels current plan is more than needed, or wants to reduce monthly costs. Review current plan, explain available lower tiers, discuss any contract implications, explain potential speed differences, and process downgrade request.',
  },
  {
    title: 'Inquire About Promotions or Deals',
    description:
      'Customer is asking about current promotions, discounts, or special offers available. Customer wants to know about new customer deals, retention offers, seasonal promotions, or bundle discounts. Check account eligibility, review current promotions, explain terms and conditions, discuss any contract requirements, and offer applicable deals.',
  },
  {
    title: 'Payment Method Update',
    description:
      'Customer needs to update their payment method on file. Credit card expired, wants to change payment method, or needs to add new card. Verify account identity, guide through payment method update process, confirm new payment method is active, and verify next billing will use new method.',
  },
  {
    title: 'Service Transfer or Move',
    description:
      'Customer is moving and needs to transfer service to new address or cancel service at current location. Customer is relocating and wants to move service, needs installation at new address, or wants to cancel at old address. Check service availability at new address, schedule installation appointment, discuss transfer fees if applicable, coordinate disconnect at old address, and confirm move dates.',
  },
  {
    title: 'Equipment Upgrade Request',
    description:
      'Customer wants to upgrade their router, modem, or other equipment to newer model. Current equipment is outdated, customer wants better performance, or needs equipment with new features. Check account equipment status, explain available equipment options, discuss upgrade costs or rental fees, schedule equipment swap if needed, and arrange return of old equipment.',
  },
  {
    title: 'Service Outage Inquiry',
    description:
      'Customer is reporting service outage or asking about known outages in their area. Internet is completely down, customer wants to know if there is a known issue, or checking outage status. Check for reported outages in customer area, verify account status, check for scheduled maintenance, provide estimated restoration time if available, and offer to create service ticket if no known outage.',
  },
  {
    title: 'Plan Comparison Request',
    description:
      'Customer wants to compare different service plans or understand plan differences. Customer is shopping for best plan, wants to understand speed differences, or comparing pricing options. Review available plans, explain speed and feature differences, compare pricing and contract terms, discuss which plan fits their usage, and answer questions about plan features.',
  },
  {
    title: 'Early Termination Fee Question',
    description:
      'Customer is asking about early termination fees or wants to cancel service before contract ends. Customer wants to cancel service, is moving, or asking about contract cancellation costs. Review contract terms and end date, explain early termination fees if applicable, discuss options to avoid fees, check for contract buyout programs, and process cancellation if requested.',
  },
  {
    title: 'Service Bundle Inquiry',
    description:
      'Customer is asking about bundling internet with TV, phone, or other services. Customer wants to add services, asking about bundle pricing, or interested in package deals. Review current services, explain available bundle options, compare bundle vs individual pricing, discuss contract requirements, and offer to set up bundle if interested.',
  },
  {
    title: 'Billing Dispute',
    description:
      'Customer is disputing a charge on their bill or believes they were charged incorrectly. Customer sees unexpected charges, questions billing accuracy, or wants to dispute specific line items. Review billing statement, investigate disputed charges, check for billing errors, explain charges or process refund if error found, and update account if needed.',
  },
  {
    title: 'Auto-Pay Setup or Changes',
    description:
      'Customer wants to set up automatic payments or modify existing auto-pay settings. Customer wants to enroll in auto-pay, change payment date, or update auto-pay preferences. Verify payment method on file, explain auto-pay benefits, set up automatic billing, confirm payment schedule, and provide confirmation of auto-pay enrollment.',
  },
  {
    title: 'Service Activation for New Customer',
    description:
      'New customer needs to activate service or set up new account. Customer just signed up, needs installation scheduled, or wants to activate self-install kit. Verify new account details, schedule installation appointment if needed, provide activation instructions, verify equipment delivery, and confirm service activation date.',
  },
  {
    title: 'Equipment Return or Replacement',
    description:
      'Customer needs to return equipment or get replacement for faulty equipment. Equipment is broken, customer is canceling service, or needs equipment swap. Verify equipment on account, process return authorization, provide return shipping label, schedule replacement delivery if needed, and confirm return receipt.',
  },
]

// Resolution steps for each scenario
// Each resolution matches the scenario by index
const resolutions = [
  {
    steps: [
      'Unplug the router power adapter from the wall outlet',
      'Wait 30 seconds for capacitors to discharge',
      'Check the power adapter for any visible damage or frayed cables',
      'Plug the power adapter back into the wall outlet firmly',
      'Wait for the power light to turn green (may take 1-2 minutes)',
      'If light remains red, try a different power outlet',
      'If still red after trying different outlet, the router may need replacement - contact support',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check for any service outages in your area on the ISP website',
      'Verify your account is active and in good standing',
      'Ensure all Ethernet cables are securely connected to the router',
      'Power cycle the router by unplugging for 30 seconds and plugging back in',
      'Wait 2-3 minutes for the router to fully boot and attempt connection',
      'If light remains orange/amber, contact ISP support for authentication reset',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check all router status lights - note which ones are on/off',
      'Verify all cable connections are secure (power, Ethernet, fiber)',
      'Power cycle the router: unplug for 30 seconds, then plug back in',
      'Wait 2-3 minutes for router to fully restart',
      'Check for service outages in your area',
      'Try connecting a device directly to the router via Ethernet cable',
      'If still no connection, contact ISP support for authentication reset',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Test internet speed using a wired connection (eliminates WiFi issues)',
      'Check for bandwidth-heavy applications running in background',
      'Verify your service plan limits match expected speeds',
      'Restart the router to clear any congestion',
      'Check router settings for any bandwidth limiting or QoS settings',
      'Test at different times of day to identify peak usage patterns',
      'If speeds consistently below plan, contact ISP for line quality check',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify account status is active (not suspended or past due)',
      'Check if ISP recently changed authentication credentials',
      'Power cycle the router completely (unplug 30 seconds)',
      'Check router MAC address matches ISP records (may need registration)',
      'Contact ISP support to verify account authentication status',
      'May require MAC address re-registration or account reactivation',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Test the Ethernet cable with a known working device',
      'Try a different Ethernet port on the router',
      'Check for physical damage to the port (bent pins, debris)',
      'Verify port is enabled in router admin settings',
      'Try a different Ethernet cable to rule out cable issues',
      'If multiple ports fail, router may need replacement',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Reposition router to central location in your home',
      'Elevate router off the floor (at least 3-4 feet high)',
      'Keep router away from metal objects and appliances',
      'Reduce interference by moving router away from cordless phones, microwaves',
      'Adjust router antennas to vertical position if applicable',
      'Consider WiFi extender or mesh network for larger homes',
      'Update router firmware if available',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check router temperature - ensure adequate ventilation around device',
      'Verify power adapter is providing stable voltage',
      'Try a different power outlet to rule out power issues',
      'Perform factory reset (will erase all settings)',
      'Update router firmware if available',
      'If restart loop continues after reset, router likely needs replacement',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Do not attempt to repair fiber cable yourself - it requires professional tools',
      'Check for visible damage: kinks, cuts, or broken connectors',
      'Ensure fiber cable is not bent beyond minimum bend radius',
      'Contact ISP immediately - fiber damage requires technician visit',
      'Do not touch exposed fiber ends (can cause eye injury)',
      'Schedule service appointment for fiber cable replacement',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check that ONT power adapter is plugged into working wall outlet',
      'Test the outlet with another device to verify power',
      'Inspect power adapter for damage or loose connections',
      'Try a different power outlet if available',
      'Check for any ONT status lights (even if power light is off)',
      'If no lights at all, ONT may need replacement - contact ISP support',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify you are using the correct router IP address (usually 192.168.1.1 or 192.168.0.1)',
      'Ensure you are connected to the router network (wired or WiFi)',
      'Try accessing from a different device or browser',
      'Clear browser cache and cookies',
      'Try accessing via HTTP instead of HTTPS (or vice versa)',
      'Perform router factory reset if credentials are unknown (will erase settings)',
      'Check router manual for default admin credentials',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Test if websites are accessible by IP address (bypasses DNS)',
      'If IP works but domain name does not, DNS is confirmed as the issue',
      'Change DNS settings on device: Use Settings > Network > DNS',
      'Set primary DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)',
      'Set secondary DNS to 8.8.4.4 (Google) or 1.0.0.1 (Cloudflare)',
      'Flush DNS cache: Windows (ipconfig /flushdns) or Mac (sudo dscacheutil -flushcache)',
      'Restart your device after changing DNS settings',
      'Alternatively, change DNS in router admin panel to apply network-wide',
      'Check router DNS settings - ensure not pointing to invalid servers',
      'If issue persists, contact ISP to verify their DNS server status',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify port forwarding rules are correctly configured in router admin',
      'Check that external IP address has not changed (use dynamic DNS if needed)',
      'Ensure firewall settings are not blocking the forwarded ports',
      'Verify the service/application is running and listening on the correct port',
      'Test port forwarding with port checker tools online',
      'May need to configure firewall exceptions on the device running the service',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and check device connection limits',
      'Review connected devices list to see how many are active',
      'Verify DHCP pool size covers all your devices (typically 192.168.1.100-200)',
      'Check router logs for IP address conflict error messages',
      'Restart router to clear connection table and force device reconnection',
      'Disconnect unused or old devices that may still be counted',
      'Check for devices with manually assigned static IPs causing conflicts',
      'Consider enabling device prioritization or bandwidth limiting',
      'If router consistently cannot handle device count, consider upgrading',
      'Some routers have hard limits (e.g., 32 devices) that cannot be changed',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check all cable connections for looseness or damage',
      'Inspect Ethernet cables for kinks, cuts, or wear',
      'Test connection stability with a wired connection',
      'Check router logs for error messages or disconnection patterns',
      'Monitor signal quality metrics in router admin panel',
      'Test at different times to identify interference patterns',
      'Contact ISP to check line quality and signal stability from their end',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify you are using the correct WiFi password (case-sensitive)',
      'Check if Caps Lock is enabled on your device',
      'Try forgetting the network and reconnecting',
      'Ensure your device supports the WiFi security protocol (WPA2/WPA3)',
      'Check router admin panel to verify WiFi password matches',
      'Try connecting from a different device to isolate the issue',
      'Reset router WiFi password if necessary',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Do not unplug or power off router during firmware update',
      'Wait at least 10-15 minutes for update to complete',
      'Check router status lights for update progress indicators',
      'If router is unresponsive, wait 30 minutes then power cycle',
      'Access router admin to check firmware update status',
      'If update failed, try downloading and installing firmware manually',
      'As last resort, perform factory reset and reinstall firmware',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Test if issue affects one site or multiple sites',
      'Try accessing the site from a different browser',
      'Clear browser cache and cookies',
      'Check router firewall or content filtering settings',
      'Try using different DNS servers (8.8.8.8, 1.1.1.1)',
      'Test from a different network to see if site is down',
      'Check if site requires specific ports that may be blocked',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Immediately unplug router and let it cool down for 30 minutes',
      'Ensure router has at least 6 inches of clearance on all sides',
      'Remove any objects blocking ventilation vents',
      'Place router in a well-ventilated, cooler location',
      'Clean dust from vents using compressed air',
      'Check if router has internal fan and verify it is working',
      'If overheating persists, router may need replacement',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Restart router to force DHCP to reassign all IP addresses',
      'Disconnect all devices from network temporarily',
      'Reconnect devices one at a time',
      'Check router admin for DHCP client list to identify conflicts',
      'Look for devices with manually assigned static IPs',
      'Ensure DHCP pool range is large enough for all devices',
      'Change router IP address range if conflicts persist',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and navigate to parental controls',
      'Review blocked website lists and categories',
      'Check time-based restrictions that may be active',
      'Verify device is not assigned to a restricted profile',
      'Temporarily disable parental controls to test',
      'Adjust content filtering levels if too restrictive',
      'Whitelist specific sites if needed',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and navigate to Guest Network settings',
      'Verify guest network is enabled and broadcasting',
      'Check that guest network has internet access enabled (not isolated)',
      'Verify guest network password matches what you are entering',
      'Check if guest network has device connection limits that may be reached',
      'Ensure guest network SSID is visible in device WiFi list',
      'Try forgetting the guest network on device and reconnecting',
      'Restart router to refresh guest network settings',
      'Try connecting from different device to isolate device-specific issues',
      'Check router firmware - some older firmware has guest network bugs',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel using router IP address',
      'Navigate to System Settings or Time/Date settings section',
      'Look for Time Synchronization or NTP settings',
      'Enable automatic time synchronization (NTP) if available',
      'Select correct timezone from dropdown menu',
      'If NTP is unavailable, manually set current date and time',
      'Save settings and wait 1-2 minutes for time to update',
      'Verify time is correct by checking router logs or system info',
      'Some routers sync time on next reboot if NTP is enabled',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and navigate to QoS settings',
      'Review current QoS rules and priority assignments',
      'Temporarily disable QoS to test if it is causing issues',
      'If performance improves, QoS rules need adjustment',
      'Modify bandwidth allocation for different devices/applications',
      'Ensure QoS rules match your actual usage patterns',
      'Re-enable QoS with adjusted settings',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Log into your ISP account portal or call customer service',
      'Check account balance and verify any past due amounts',
      'Review recent payment history for failed transactions',
      'Update payment method if card expired or invalid',
      'Make payment for any outstanding balance',
      'Verify account information is current and accurate',
      'Request service restoration after payment is processed',
      'Wait 15-30 minutes for service to be reactivated',
      'Power cycle router after service is restored',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Locate the reset button on your router (usually small hole on back)',
      'Use paperclip or pin to press and hold reset button',
      'Hold reset button for 10-15 seconds until lights flash',
      'Release button and wait 2-3 minutes for router to reboot',
      'Router will restore to factory default settings',
      'Access router using default IP address (usually 192.168.1.1)',
      'Log in with default username and password (check router label)',
      'Reconfigure WiFi network name and password',
      'Reconnect all devices to the new network',
      'Note: All custom settings, port forwards, and configurations will be lost',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check ONT status lights - low signal may show amber/red indicators',
      'Inspect fiber cable for any visible damage, kinks, or tight bends',
      'Ensure fiber connector is fully seated in ONT port',
      'Check that fiber cable is not bent beyond minimum radius (usually 2 inches)',
      'Inspect fiber connector end for dirt, scratches, or damage',
      'Do not touch the fiber connector end with bare hands',
      'Check ONT admin panel for signal level readings if accessible',
      'Contact ISP support - low light levels require professional testing',
      'ISP technician may need to check fiber splice points or replace cable',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check router firewall settings for VPN protocol blocking',
      'Verify VPN ports (typically UDP 500, 4500 for IPSec) are not blocked',
      'Try connecting VPN directly to device, bypassing router',
      'Check router firmware version - older firmware may not support VPN passthrough',
      'Enable VPN passthrough in router settings if available',
      'Configure port forwarding for VPN ports if passthrough unavailable',
      'Try different VPN protocol (OpenVPN, IPSec, L2TP)',
      'Contact VPN provider for router-specific configuration instructions',
      'Consider using router with built-in VPN support',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and verify WPS is enabled',
      'Check if WPS is temporarily locked (usually after 3 failed attempts)',
      'Wait 5-10 minutes if WPS is locked, then try again',
      'Press WPS button on router, then activate WPS on device within 2 minutes',
      'Ensure device supports WPS (most modern devices do)',
      'Try alternative connection method: use WiFi password instead',
      'Check router manual for WPS button location and procedure',
      'If WPS consistently fails, use manual WiFi password entry',
      'Note: WPS has security vulnerabilities - consider disabling if not needed',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Log into ISP account portal to view current data usage',
      'Check usage trends to identify peak consumption periods',
      'Review which devices or applications are using most bandwidth',
      'Set up usage alerts to monitor consumption',
      'Reduce video streaming quality (lower resolution uses less data)',
      'Schedule large downloads/uploads for off-peak hours',
      'Disable automatic cloud backups or schedule for off-peak',
      'Check for background applications consuming bandwidth',
      'Consider upgrading to unlimited data plan if consistently exceeding limits',
      'Contact ISP to discuss plan options if throttling is affecting service',
    ],
    stepType: 'bullets' as const,
  },
  {
    steps: [
      'Find your device MAC address (Settings > About > Network on most devices)',
      'Access router admin panel and navigate to MAC filtering settings',
      'Check if MAC filtering is set to "Allow" or "Deny" mode',
      'If in Allow mode: add your device MAC address to the allowed list',
      'If in Deny mode: remove your device MAC address from blocked list',
      'Save settings and wait for router to apply changes',
      'Disconnect and reconnect device to network',
      'Temporarily disable MAC filtering to test if it is the issue',
      'Re-enable MAC filtering after adding necessary devices',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access router admin panel and navigate to UPnP settings',
      'Verify UPnP is enabled (should be on by default)',
      'Check router system logs for UPnP-related error messages',
      'Restart router to refresh UPnP service',
      'Check router firmware version and update if available',
      'Test UPnP functionality with application that requires it',
      'If UPnP still not working, manually configure port forwarding',
      'Contact router manufacturer support for UPnP troubleshooting',
      'Some routers require specific firmware versions for UPnP support',
    ],
    stepType: 'bullets' as const,
  },
  {
    steps: [
      'Verify bridge mode is correctly enabled in router settings',
      'Ensure another router or device is handling DHCP and routing',
      'Check cable connections - bridge mode typically uses specific port',
      'Verify IP addressing - bridge mode router should get IP from main router',
      'Check for IP address conflicts between routers',
      'Test with bridge mode disabled to see if issue is mode-specific',
      'Ensure main router is properly configured to handle additional devices',
      'Check router compatibility - not all routers support bridge mode well',
      'Consider using access point mode instead if bridge mode problematic',
      'Contact router manufacturer for bridge mode configuration assistance',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Access customer account in billing system',
      'Review current billing statement line by line',
      'Explain each charge: base service, equipment fees, taxes, surcharges',
      'Break down any promotional credits or discounts applied',
      'Clarify any one-time charges or prorated amounts',
      'Offer to email detailed billing statement',
      'Answer any specific questions about charges',
      'Document conversation for account notes',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Review customer current plan and service tier',
      'Check available upgrade options for their area',
      'Explain speed differences between current and upgrade tiers',
      'Discuss pricing and any promotional rates available',
      'Review contract terms if upgrade requires new agreement',
      'Explain installation requirements if any',
      'Process upgrade request and confirm new service details',
      'Schedule any necessary installation or activation',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Review customer current plan details',
      'Check available lower tier options',
      'Explain speed and feature differences with downgrade',
      'Discuss any contract implications or early termination fees',
      'Confirm customer understands potential service changes',
      'Process downgrade request',
      'Explain when changes take effect',
      'Update account and confirm new plan details',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check customer account status and tenure',
      'Review current promotions available for their account',
      'Explain promotion terms and conditions',
      'Discuss any contract requirements for promotional pricing',
      'Compare promotional pricing to current plan',
      'Check eligibility for new customer or retention offers',
      'Apply applicable promotion if customer agrees',
      'Confirm promotion details and duration',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify customer identity with account security questions',
      'Access account payment settings',
      'Guide customer to payment method update section',
      'Have customer enter new payment method details',
      'Verify new payment method is accepted',
      'Confirm new payment method is set as primary',
      'Verify next billing will use new payment method',
      'Send confirmation email with updated payment info',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify service availability at new address',
      'Check if installation is required at new location',
      'Schedule installation appointment if needed',
      'Discuss any transfer or installation fees',
      'Coordinate disconnect date at old address',
      'Confirm service transfer dates',
      'Update account with new service address',
      'Provide customer with move confirmation and contact info',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check current equipment on customer account',
      'Review available equipment upgrade options',
      'Explain differences between current and new equipment',
      'Discuss upgrade costs or equipment rental fees',
      'Schedule equipment swap appointment if needed',
      'Arrange for new equipment delivery',
      'Provide instructions for returning old equipment',
      'Confirm equipment upgrade completion',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Check outage reporting system for customer area',
      'Verify if there are any known outages or maintenance',
      'Check customer account status for service issues',
      'Review any scheduled maintenance in area',
      'Provide estimated restoration time if outage confirmed',
      'Create service ticket if no known outage found',
      'Schedule technician visit if needed',
      'Follow up with customer on resolution',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Review all available service plans for customer area',
      'Compare speed tiers and pricing',
      'Explain feature differences between plans',
      'Discuss contract terms for each plan option',
      'Ask about customer usage needs to recommend best fit',
      'Compare current plan to other options',
      'Answer specific questions about plan features',
      'Offer to help switch plans if customer decides',
    ],
    stepType: 'bullets' as const,
  },
  {
    steps: [
      'Review customer contract terms and end date',
      'Calculate remaining contract time',
      'Explain early termination fee structure if applicable',
      'Check for any contract buyout or waiver programs',
      'Discuss options to avoid fees (transfer, upgrade, etc.)',
      'Process cancellation if customer confirms',
      'Explain final billing and equipment return process',
      'Confirm cancellation date and account closure',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Review customer current services',
      'Check available bundle options (Internet + TV + Phone)',
      'Compare bundle pricing vs individual service costs',
      'Explain bundle features and benefits',
      'Discuss contract requirements for bundles',
      'Calculate potential savings with bundle',
      'Process bundle setup if customer interested',
      'Schedule any necessary installations',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Review disputed charges on billing statement',
      'Investigate charge history and account activity',
      'Check for billing errors or system issues',
      'Verify if charges are legitimate or incorrect',
      'Explain charges to customer or process refund if error',
      'Update account to correct any billing issues',
      'Provide written confirmation of resolution',
      'Follow up to ensure customer is satisfied',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify payment method is on file and valid',
      'Explain auto-pay benefits and convenience',
      'Set up automatic payment from payment method',
      'Confirm payment date (usually billing date)',
      'Explain how auto-pay works and when charges occur',
      'Provide confirmation of auto-pay enrollment',
      'Send email confirmation with auto-pay details',
      'Remind customer they can cancel auto-pay anytime',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify new account details and customer information',
      'Check service availability at installation address',
      'Schedule installation appointment or provide self-install kit',
      'Confirm equipment delivery if applicable',
      'Provide activation instructions for self-install',
      'Verify service activation date and time',
      'Provide customer with account login credentials',
      'Confirm installation and test service activation',
    ],
    stepType: 'numbered' as const,
  },
  {
    steps: [
      'Verify equipment on customer account',
      'Check if equipment return is required (cancellation) or replacement needed',
      'Process return authorization and generate return label',
      'Provide return shipping instructions',
      'Schedule replacement equipment delivery if needed',
      'Confirm return deadline and shipping address',
      'Track return shipment and confirm receipt',
      'Update account once equipment is received',
    ],
    stepType: 'numbered' as const,
  },
]

async function seedDatabase() {
  console.log('Starting database seeding...')
  console.log(`Processing ${scenarios.length} scenarios...`)

  try {
    // Check which scenarios already exist
    const existingScenarios = await pool.query(
      'SELECT title FROM isp_support.scenarios',
    )
    const existingTitles = new Set(
      existingScenarios.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i]

      if (existingTitles.has(scenario.title)) {
        console.log(
          `[${i + 1}/${scenarios.length}] Skipping (already exists): ${scenario.title}`,
        )
        continue
      }

      console.log(
        `[${i + 1}/${scenarios.length}] Processing: ${scenario.title}`,
      )

      const textToEmbed = `${scenario.title}. ${scenario.description}`
      const embedding = await generateEmbedding(textToEmbed)
      await insertScenario(scenario.title, scenario.description, embedding)

      console.log(`✓ Inserted: ${scenario.title}`)
    }

    // Get all scenarios with their titles to match by title
    const scenarioResult = await pool.query(
      'SELECT id, title FROM isp_support.scenarios ORDER BY id',
    )
    const scenarioMap = new Map<string, number>()
    scenarioResult.rows.forEach((row: { id: number; title: string }) => {
      scenarioMap.set(row.title, row.id)
    })

    // Now insert resolutions for each scenario, matching by title
    console.log('\nInserting resolutions...')
    for (let i = 0; i < resolutions.length && i < scenarios.length; i++) {
      const resolution = resolutions[i]
      const scenario = scenarios[i]
      const scenarioId = scenarioMap.get(scenario.title)

      if (!scenarioId) {
        console.log(
          `⚠️  Skipping resolution for "${scenario.title}" - scenario not found in database`,
        )
        continue
      }

      await insertResolution(scenarioId, resolution.steps, resolution.stepType)

      console.log(
        `✓ Inserted resolution for scenario ID ${scenarioId} (${scenario.title})`,
      )
    }

    console.log('\n✓ Database seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedDatabase()
