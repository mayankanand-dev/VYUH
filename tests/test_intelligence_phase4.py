"""Unit & Integration Tests for Phase 4: Claim Extraction & NLI Verification (Developer 2)."""

import unittest
from intelligence.claim_extraction import ClaimExtractor
from intelligence.claim_verification import NLIVerifier


class TestPhase4(unittest.TestCase):
    def test_claim_extraction(self):
        extractor = ClaimExtractor()
        text = "Breaking: Delhi police registered over 25 FIRs against protest leaders today."
        claims = extractor.extract_claims(text, "rec_001")
        self.assertGreaterEqual(len(claims), 1)
        self.assertEqual(claims[0].source_record_id, "rec_001")

    def test_nli_verification_supported(self):
        verifier = NLIVerifier()
        stance, conf, expl = verifier.assess_entailment_polarity(
            claim_text="Police registered FIRs against farm leaders",
            evidence_text="Delhi Police officially confirmed that multiple FIRs were registered against farm leaders."
        )
        self.assertIn(stance, ["supported", "mixed"])
        self.assertGreater(conf, 0.5)

    def test_nli_verification_zero_hallucination_fallback(self):
        verifier = NLIVerifier()
        # Querying with completely unrelated/missing evidence
        stance, conf, expl = verifier.assess_entailment_polarity(
            claim_text="Alien spaceships landed at Red Fort during the protest",
            evidence_text=""
        )
        self.assertEqual(stance, "insufficient_evidence")
        self.assertEqual(conf, 0.0)


if __name__ == "__main__":
    unittest.main()
