"""
Runs a fixed set of test questions against your local DocChat backend
and saves the answers to a CSV for manual scoring.

Before running:
1. Make sure your FastAPI backend is running (fastapi dev main.py)
2. Fill in EMAIL / PASSWORD below with an account you've already signed up
3. Fill in DOCUMENT_ID with the id of the pruning paper you uploaded
4. pip install requests --break-system-packages   (if not already installed)
"""

import requests
import csv

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "testexample@gmail.com"        # <-- change to your account
PASSWORD = "testexample123"      # <-- change to your password
DOCUMENT_ID = 2                   # <-- change to your document's id

QUESTIONS = [
    # Easy / direct
    "What are the two key factors the paper identifies as causing accuracy disparities from pruning?",
    "What dataset is used for the main vision task experiments?",
    "What is the 'Matthew effect' the paper describes?",
    "What is 'fairness violation' (xi) as defined in the paper?",
    "What are the four mitigation models compared in the evaluation section?",

    # Medium / connecting chunks
    "How does group size relate to gradient norm, according to Proposition 1?",
    "Why does the paper say groups closer to the decision boundary are more affected by pruning?",
    "What's the relationship between a group's Hessian eigenvalues and its gradient norms?",
    "Why is the relaxed mitigation solution (Equation 8) preferred over the full version (Equation 7) in practice?",
    "Between Fair Aft Pruning and Fair Bf Pruning, which tends to achieve better fairness violations, and why?",

    # Hard / inferential
    "Explain the full causal chain the paper proposes, from imbalanced dataset to gradient norms to excessive loss to unfairness.",
    "According to the paper, would equalizing only the Hessian without addressing gradient norms be sufficient to fix the unfairness? Why or why not?",
    "What computational tradeoff does the mitigation solution in Equation 8 make compared to Equation 7?",

    # Unanswerable (hallucination test)
    "What pruning rate does the paper recommend for production deployment of facial recognition systems?",
    "Does the paper test their mitigation method on language models like BERT or GPT?",
    "What is the exact runtime in seconds of the Fair Both method on the ResNet50 experiments?",
]

LABELS = (
    ["easy"] * 5
    + ["medium"] * 5
    + ["hard"] * 3
    + ["unanswerable"] * 3
)


def main():
    login_res = requests.post(
        f"{BASE_URL}/login",
        json={"email": EMAIL, "password": PASSWORD},
    )
    login_res.raise_for_status()
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    rows = []
    for i, (question, label) in enumerate(zip(QUESTIONS, LABELS), start=1):
        print(f"[{i}/{len(QUESTIONS)}] ({label}) {question[:60]}...")

        res = requests.post(
            f"{BASE_URL}/ask",
            headers=headers,
            json={"query": question, "document_id": DOCUMENT_ID},
            stream=True,
        )
        res.raise_for_status()

        answer = ""
        for line in res.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            chunk = line[6:]
            if chunk == "[DONE]":
                break
            answer += chunk

        rows.append(
            {
                "number": i,
                "category": label,
                "question": question,
                "answer": answer,
                "score (fill in: correct/partial/wrong/hallucinated)": "",
                "notes": "",
            }
        )

    with open("eval_results.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print("\nDone. Results saved to eval_results.csv")


if __name__ == "__main__":
    main()