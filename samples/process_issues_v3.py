import json
import re

def clean_body(body):
    if not body:
        return "No description provided."
    summary = re.sub(r'#+\s*', '', body)
    summary = re.sub(r'[\r\n]+', ' ', summary)
    summary = summary.strip()
    return summary[:150] + "..." if len(summary) > 150 else summary

def get_linked_issues(pr_text):
    if not pr_text:
        return []
    # Match common patterns: Fixes #123, Closes #123, #123
    # This is a heuristic
    matches = re.findall(r'(?:fixe?s?|close?s?|resolve?s?|refs?|#)\s*#?(\d+)', pr_text, re.IGNORECASE)
    return [int(m) for m in matches]

def generate_report(issues_file, prs_file, output_file):
    with open(issues_file, 'r') as f:
        issues = json.load(f)
    with open(prs_file, 'r') as f:
        prs = json.load(f)

    # Map of issue numbers that have active PRs
    linked_issue_numbers = set()
    for pr in prs:
        linked = get_linked_issues(pr['title'] + " " + (pr['body'] or ""))
        linked_issue_numbers.update(linked)

    beginner_keywords = ['good first issue', 'documentation', 'docs', 'readme', 'link', 'typo', 'beginner']
    
    beginner_issues = []
    
    for issue in issues:
        num = issue['number']
        # Check if assigned or has a linked PR
        has_assignee = len(issue.get('assignees', [])) > 0
        has_pr = num in linked_issue_numbers
        
        issue['is_active'] = has_assignee or has_pr
        issue['status_flag'] = "[PR進行中/担当有]" if issue['is_active'] else "[着手可能]"
        
        is_beginner = False
        labels = [l['name'].lower() for l in issue['labels']]
        title_lower = issue['title'].lower()
        
        if any(kw in labels for kw in beginner_keywords) or \
           'good first issue' in title_lower or \
           'documentation' in title_lower or \
           'readme' in title_lower or \
           'link' in title_lower:
            is_beginner = True
            
        if num in [231, 229, 106, 29]:
            is_beginner = True

        # Recommend if beginner-friendly AND NO active PR/assignee
        if is_beginner and not issue['is_active']:
            beginner_issues.append(issue)

    with open(output_file, 'w') as f:
        f.write("# Context Hub: OSS Beginner's Issue Report\n\n")
        f.write("このレポートは、andrewyng/context-hub リポジトリへの貢献を検討している初心者の方向けに作成されました。\n\n")
        
        f.write("## 🌟 初心者におすすめの Issue (完全未着手)\n")
        f.write("これらの Issue は初心者向けであり、かつ現在 **担当者がおらず、PRも作成されていない** ため、今すぐ貢献を開始できます。\n\n")
        
        if not beginner_issues:
            f.write("現在、おすすめできる完全未着手の Issue はありません。全一覧を確認してください。\n\n")
        else:
            for issue in beginner_issues[:5]:
                f.write(f"### {issue['status_flag']} [#{issue['number']}] {issue['title']}\n")
                labels = ", ".join([f"`{l['name']}`" for l in issue['labels']])
                f.write(f"**Labels:** {labels if labels else 'None'}\n\n")
                f.write(f"**概要:** {clean_body(issue['body'])}\n\n")
                f.write(f"**選定理由:** 初心者向けで、かつ誰も着手していないため、競合の心配なく進められます。\n\n")
                f.write(f"[GitHubで見る]({issue['url']})\n\n")
                f.write("---\n\n")

        f.write("## 📝 全ての Open Issues\n")
        f.write("現在オープンな全ての Issue の一覧です。`[着手可能]` のものを優先的に確認することをお勧めします。\n\n")
        
        all_sorted = sorted(issues, key=lambda x: x['number'], reverse=True)
        for issue in all_sorted:
            f.write(f"### {issue['status_flag']} [#{issue['number']}] {issue['title']}\n")
            labels = ", ".join([f"`{l['name']}`" for l in issue['labels']])
            f.write(f"**Labels:** {labels if labels else 'None'}\n")
            f.write(f"**更新日:** {issue['updatedAt']}\n\n")
            f.write(f"**概要:** {clean_body(issue['body'])}\n\n")
            f.write(f"[詳細を確認する]({issue['url']})\n\n")
            f.write("---\n\n")

if __name__ == "__main__":
    generate_report('all_issues.json', 'all_prs.json', 'output.md')
