import os
import shutil
import re

components_dir = 'src/components'
subdirs = {
    'club': ['LandingHero.tsx', 'RosterSection.tsx', 'TeamOverviewModal.tsx', 'TeamDesignerPage.tsx'],
    'matches': ['MatchCenter.tsx', 'LiveScorePanel.tsx', 'MatchRequestsPanel.tsx', 'TournamentsPage.tsx', 'ChampionsDayManager.tsx'],
    'player': ['PlayerPersonalProfile.tsx', 'StatsDashboard.tsx', 'BadgesPage.tsx', 'RecruitmentPage.tsx', 'ScoutingPage.tsx', 'AcademyRecruitment.tsx'],
    'finance': ['FinanceManager.tsx', 'SponsorDonationPortal.tsx', 'MarketplacePage.tsx'],
    'communication': ['MessagingSystem.tsx', 'NewsGallery.tsx', 'EventCalendar.tsx'],
    'admin': ['AdminPanel.tsx', 'AccountSettings.tsx'],
    'layout': ['Navbar.tsx', 'Sidebar.tsx', 'MobileNavBar.tsx', 'TerrainsMapPage.tsx'],
    'common': ['AuthModal.tsx', 'NotificationPanel.tsx', 'NetworkStatusBanner.tsx', 'PwaInstallPrompt.tsx']
}

for folder, files in subdirs.items():
    folder_path = os.path.join(components_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    for fname in files:
        src = os.path.join(components_dir, fname)
        dst = os.path.join(folder_path, fname)
        if os.path.exists(src):
            with open(src, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Adjust parent relative imports: '../' -> '../../'
            adjusted = re.sub(r'from (\'|\")\.\./', r'from \1../../', content)
            # Adjust sibling relative imports: from './' -> from '../' (since other components may be in parent)
            # But let's check what sibling imports exist
            # Write to new destination
            with open(dst, 'w', encoding='utf-8') as f:
                f.write(adjusted)
            
            # In original place, write a forwarding proxy
            basename = os.path.splitext(fname)[0]
            proxy_content = f"export * from './{folder}/{basename}';\n"
            if 'export default ' in content:
                proxy_content += f"export {{ default }} from './{folder}/{basename}';\n"
            with open(src, 'w', encoding='utf-8') as f:
                f.write(proxy_content)
            print(f"Organized: {fname} -> {folder}/{fname}")

print("Subdirectory organization complete!")
