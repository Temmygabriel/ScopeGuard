# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import genlayer.gl as gl
from genlayer import TreeMap, u256
import json


# -------------------------------------------------------------------------
# ScopeGuard
#
# A freelancer drafts a brief (goal, deliverables, price, deadlines).
# The client reviews it on their own device with their own address and
# signs it. Once both addresses are attached, the brief locks — its
# wording can never change again. No edit path exists on purpose: if a
# freelancer wants to change terms, they cancel and create a new brief.
#
# At delivery, the client either accepts (no AI call, free) or disputes.
# Only a dispute triggers the one AI call, which compares the locked
# brief against what was delivered and what the client says is wrong,
# and rules FULFILLED / BREACHED / PARTIAL.
#
# No funds, no balances, no treasury are stored or moved by this
# contract — only brief text and verdicts. This mirrors CommitChain's
# design and avoids the spoofing/treasury-drain pattern that got an
# earlier project (CommunityPulse) rejected.
# -------------------------------------------------------------------------


MAX_OPEN_BRIEFS = 5

# Statuses that count against a freelancer's open-brief cap.
OPEN_STATUSES = {"draft", "locked", "delivered", "disputed"}


class ScopeGuard(gl.Contract):
    brief_count: u256
    briefs: TreeMap[str, str]          # brief_id -> JSON
    member_briefs: TreeMap[str, str]   # address  -> [brief_id, ...] JSON
    recent_ids: TreeMap[u256, str]     # counter index -> brief_id

    def __init__(self):
        self.brief_count = u256(0)

    # ---------------------------------------------------------------
    # internal helpers
    # ---------------------------------------------------------------

    def _get_brief(self, brief_id: str) -> dict:
        raw = self.briefs.get(brief_id)
        if raw is None:
            raise Exception("brief not found")
        return json.loads(raw)

    def _save_brief(self, brief_id: str, data: dict) -> None:
        self.briefs[brief_id] = json.dumps(data)

    def _append_member_brief(self, address: str, brief_id: str) -> None:
        raw = self.member_briefs.get(address)
        ids = json.loads(raw) if raw is not None else []
        if brief_id not in ids:
            ids.append(brief_id)
        self.member_briefs[address] = json.dumps(ids)

    def _open_brief_count(self, freelancer_address: str) -> int:
        raw = self.member_briefs.get(freelancer_address)
        if raw is None:
            return 0
        ids = json.loads(raw)
        count = 0
        for bid in ids:
            b = self._get_brief(bid)
            if b["freelancer_address"] == freelancer_address and b["status"] in OPEN_STATUSES:
                count += 1
        return count

    # ---------------------------------------------------------------
    # write methods
    # ---------------------------------------------------------------

    @gl.public.write
    def create_brief(
        self,
        freelancer_address: str,
        freelancer_name: str,
        title: str,
        deliverables_text: str,
        price: str,
        deadline: str,
        sign_deadline: str,
    ) -> str:
        if self._open_brief_count(freelancer_address) >= MAX_OPEN_BRIEFS:
            raise Exception("max open briefs reached, cancel or resolve one first")

        self.brief_count = u256(int(self.brief_count) + 1)
        n = int(self.brief_count)
        brief_id = "BRF" + str(n).zfill(6)

        data = {
            "brief_id": brief_id,
            "freelancer_address": freelancer_address,
            "freelancer_name": freelancer_name,
            "client_address": "",
            "title": title,
            "deliverables_text": deliverables_text,
            "price": price,
            "deadline": deadline,
            "sign_deadline": sign_deadline,
            "status": "draft",
            "delivery_text": "",
            "delivery_link": "",
            "dispute_text": "",
            "dispute_link": "",
            "verdict": "",
            "reasoning": "",
            "confidence": "",
        }
        self._save_brief(brief_id, data)
        self._append_member_brief(freelancer_address, brief_id)

        self.recent_ids[self.brief_count] = brief_id
        return brief_id

    @gl.public.write
    def sign_brief(self, brief_id: str, client_address: str) -> None:
        b = self._get_brief(brief_id)
        if b["status"] != "draft":
            raise Exception("brief is not open for signing")
        if client_address == b["freelancer_address"]:
            raise Exception("client cannot be the same address as the freelancer")

        b["status"] = "locked"
        b["client_address"] = client_address
        self._save_brief(brief_id, b)
        self._append_member_brief(client_address, brief_id)

    @gl.public.write
    def cancel_brief(self, brief_id: str, freelancer_address: str) -> None:
        b = self._get_brief(brief_id)
        if b["freelancer_address"] != freelancer_address:
            raise Exception("only the freelancer who created this brief can cancel it")
        if b["status"] != "draft":
            raise Exception("only an unsigned draft can be cancelled")

        b["status"] = "cancelled"
        self._save_brief(brief_id, b)

    @gl.public.write
    def check_sign_expired(self, brief_id: str, current_time: str) -> None:
        b = self._get_brief(brief_id)
        if b["status"] != "draft":
            raise Exception("brief is not awaiting signature")
        if int(current_time) <= int(b["sign_deadline"]):
            raise Exception("sign deadline has not passed yet")

        b["status"] = "expired"
        self._save_brief(brief_id, b)

    @gl.public.write
    def submit_delivery(
        self,
        brief_id: str,
        freelancer_address: str,
        delivery_text: str,
        delivery_link: str,
    ) -> None:
        b = self._get_brief(brief_id)
        if b["freelancer_address"] != freelancer_address:
            raise Exception("only the freelancer on this brief can submit delivery")
        if b["status"] != "locked":
            raise Exception("brief must be locked before delivery can be submitted")

        b["status"] = "delivered"
        b["delivery_text"] = delivery_text
        b["delivery_link"] = delivery_link
        self._save_brief(brief_id, b)

    @gl.public.write
    def accept_delivery(self, brief_id: str, client_address: str) -> None:
        b = self._get_brief(brief_id)
        if b["client_address"] != client_address:
            raise Exception("only the client on this brief can accept delivery")
        if b["status"] != "delivered":
            raise Exception("nothing to accept yet")

        b["status"] = "fulfilled"
        b["verdict"] = "FULFILLED"
        b["reasoning"] = "Client accepted delivery directly, no dispute raised."
        self._save_brief(brief_id, b)

    @gl.public.write
    def submit_dispute(
        self,
        brief_id: str,
        client_address: str,
        dispute_text: str,
        dispute_link: str,
    ) -> None:
        b = self._get_brief(brief_id)
        if b["client_address"] != client_address:
            raise Exception("only the client on this brief can raise a dispute")
        if b["status"] != "delivered":
            raise Exception("brief must be delivered before it can be disputed")

        b["status"] = "disputed"
        b["dispute_text"] = dispute_text
        b["dispute_link"] = dispute_link
        self._save_brief(brief_id, b)

    @gl.public.write
    def evaluate_dispute(self, brief_id: str) -> None:
        b = self._get_brief(brief_id)
        if b["status"] != "disputed":
            raise Exception("brief is not under dispute")

        title = b["title"]
        deliverables_text = b["deliverables_text"]
        deadline = b["deadline"]
        delivery_text = b["delivery_text"]
        delivery_link = b["delivery_link"]
        dispute_text = b["dispute_text"]
        dispute_link = b["dispute_link"]

        def generate() -> str:
            prompt = f"""You are ruling on a freelance work dispute. Compare the
original locked brief against what was delivered and the client's
complaint. Judge only against what the brief actually asked for, not
what would have been nice to have.

LOCKED BRIEF
Title: {title}
Deliverables: {deliverables_text}
Deadline: {deadline}

FREELANCER'S DELIVERY
Description: {delivery_text}
Link: {delivery_link}

CLIENT'S DISPUTE
Complaint: {dispute_text}
Evidence link: {dispute_link}

Return ONLY a JSON object, no other text, in this exact shape:
{{"verdict": "FULFILLED" | "BREACHED" | "PARTIAL", "reasoning": "one or two sentences", "confidence": "high" | "medium" | "low"}}
"""
            return gl.nondet.exec_prompt(prompt)

        result_raw = gl.eq_principle.prompt_non_comparative(
            generate,
            task="Rule on a freelance scope dispute by comparing a locked brief, a delivery, and a client complaint.",
            criteria="A valid response is a JSON object with verdict FULFILLED, BREACHED, or PARTIAL, plus reasoning and a confidence level, based strictly on the locked brief text.",
        )

        try:
            start = result_raw.find("{")
            end = result_raw.rfind("}") + 1
            result_json = json.loads(result_raw[start:end])
        except Exception:
            result_json = {}

        verdict = result_json.get("verdict", "PARTIAL")
        reasoning = result_json.get("reasoning", "Verdict could not be fully parsed.")
        confidence = result_json.get("confidence", "low")

        b["status"] = "resolved"
        b["verdict"] = verdict
        b["reasoning"] = reasoning
        b["confidence"] = confidence
        self._save_brief(brief_id, b)

    @gl.public.write
    def finalize_game(self, brief_id: str) -> None:
        pass

    # ---------------------------------------------------------------
    # view methods
    # ---------------------------------------------------------------

    @gl.public.view
    def get_brief(self, brief_id: str) -> dict:
        return self._get_brief(brief_id)

    @gl.public.view
    def get_my_briefs(self, address: str) -> list:
        raw = self.member_briefs.get(address)
        if raw is None:
            return []
        ids = json.loads(raw)
        briefs = [self._get_brief(bid) for bid in ids]
        briefs.reverse()  # newest first
        return briefs

    @gl.public.view
    def get_profile(self, address: str) -> dict:
        raw = self.member_briefs.get(address)
        ids = json.loads(raw) if raw is not None else []

        as_freelancer = {"fulfilled": 0, "breached": 0, "partial": 0, "current_streak": 0, "longest_streak": 0}
        as_client = {"disputes_raised": 0, "disputes_upheld": 0}

        freelancer_history = []
        for bid in ids:
            b = self._get_brief(bid)
            if b["freelancer_address"] == address and b["status"] in ("fulfilled", "resolved"):
                freelancer_history.append(b)
            if b["client_address"] == address and b["status"] in ("disputed", "resolved"):
                as_client["disputes_raised"] += 1
                if b["status"] == "resolved" and b["verdict"] == "BREACHED":
                    as_client["disputes_upheld"] += 1

        current_streak = 0
        longest_streak = 0
        for b in freelancer_history:
            verdict = b["verdict"]
            if verdict == "FULFILLED":
                as_freelancer["fulfilled"] += 1
                current_streak += 1
                longest_streak = max(longest_streak, current_streak)
            elif verdict == "BREACHED":
                as_freelancer["breached"] += 1
                current_streak = 0
            elif verdict == "PARTIAL":
                as_freelancer["partial"] += 1
                # neutral, streak unchanged

        as_freelancer["current_streak"] = current_streak
        as_freelancer["longest_streak"] = longest_streak

        return {"address": address, "as_freelancer": as_freelancer, "as_client": as_client}

    @gl.public.view
    def get_recent_briefs(self, limit: u256) -> list:
        result = []
        n = int(self.brief_count)
        want = int(limit)
        i = n
        while i >= 1 and len(result) < want:
            brief_id = self.recent_ids.get(u256(i))
            if brief_id is not None:
                b = self._get_brief(brief_id)
                if b["status"] != "draft" and b["status"] != "cancelled":
                    result.append(b)
            i -= 1
        return result
