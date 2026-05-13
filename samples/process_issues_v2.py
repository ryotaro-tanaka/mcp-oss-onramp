import json
import re

def clean_body(body):
    if not body:
        return "No description provided."
    summary = re.sub(r'#+\s*', '', body)
    summary = re.sub(r'[\r\n]+', ' ', summary)
    summary = summary.strip()
    return summary[:150] + "..." if len(summary) > 150 else summary

def generate_report(json_file, output_file):
    with open(json_file, 'r') as f:
        issues = json.load(f)

    beginner_keywords = ['good first issue', 'documentation', 'docs', 'readme', 'link', 'typo', 'beginner']
    
    beginner_issues = []
    
    for issue in issues:
        has_pr = len(issue.get('pullRequests', [])) > 0
        issue['status_flag'] = "[PR進行中]" if has_pr else "[着手可能]"
        
        is_beginner = False
        labels = [l['name'].lower() for l in issue['labels']]
        title_lower = issue['title'].lower()
        
        if any(kw in labels for kw in beginner_keywords) or \
           'good first issue' in title_lower or \
           'documentation' in title_lower or \
           'readme' in title_lower or \
           'link' in title_lower:
            is_beginner = True
            
        if issue['number'] in [231, 229, 106, 29]:
            is_beginner = True

        # Only recommend if it's beginner-friendly AND has no active PR
        if is_beginner and not has_pr:
            beginner_issues.append(issue)

    with open(output_file, 'w') as f:
        f.write("# Context Hub: OSS Beginner's Issue Report\n\n")
        f.write("このレポートは、andrewyng/context-hub リポジトリへの貢献を検討している初心者の方向けに作成されました。\n\n")
        
        f.write("## 🌟 初心者におすすめの Issue (PR未作成)\n")
        f.write("これらの Issue は比較的取り組みやすく、まだ誰もプルリクエストを作成していないため、着手する絶好のチャンスです。\n\n")
        
        if not beginner_issues:
            f.write("現在、おすすめできる未着手の Issue はありません。全一覧を確認してください。\n\n")
        else:
            for issue in beginner_issues[:5]:
                f.write(f"### {issue['status_flag']} [#{issue['number']}] {issue['title']}\n")
                labels = ", ".join([f"`{l['name']}`" for l in issue['labels']])
                f.write(f"**Labels:** {labels if labels else 'None'}\n\n")
                f.write(f"**概要:** {clean_body(issue['body'])}\n\n")
                f.write(f"**選定理由:** 初心者向けであり、かつ現在進行中のPRがないため、確実な貢献が可能です。\n\n")
                f.write(f"[GitHubで見る]({issue['url']})\n\n")
                f.write("---\n\n")

        f.write("## 📝 全ての Open Issues\n")
        f.write("現在オープンな全ての Issue の一覧です。`[着手可能]` のものを探すことをお勧めします。\n\n")
        
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
    generate_report('all_issues.json', 'output.md')
