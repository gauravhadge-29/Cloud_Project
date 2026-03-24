"""
Test script to demonstrate Natural Language Generation functionality.
Run this to see the NLG narratives in action.
"""

from summarizer import NaturalLanguageGenerator

# Test data
test_incident = {
    "severity": "ERROR",
    "timestamp": "2024-01-15 14:32:45",
    "message": "Database connection timeout after 30 seconds",
    "template": "Database <id> connection timeout after <num> seconds"
}

test_transitions = [
    {"transition": "auth_check -> request_processing -> response_sent", "count": 45},
    {"transition": "startup -> initialization -> error_handling", "count": 23},
]

test_keywords = [
    {"term": "database", "count": 156},
    {"term": "connection", "count": 142},
    {"term": "timeout", "count": 98},
    {"term": "error", "count": 87},
]

test_cluster_terms = ["connect", "error", "database", "failed"]

# Generate narratives
nlg = NaturalLanguageGenerator()

print("=" * 70)
print("NATURAL LANGUAGE GENERATION TEST")
print("=" * 70)

print("\n📊 INCIDENT NARRATIVE:")
print("-" * 70)
incident_narrative = nlg.generate_incident_narrative(test_incident)
print(incident_narrative)

print("\n🔍 CLUSTER NARRATIVE:")
print("-" * 70)
cluster_narrative = nlg.generate_cluster_narrative("Cluster_0", 89, test_cluster_terms)
print(cluster_narrative)

print("\n🔀 TRANSITION NARRATIVES:")
print("-" * 70)
for transition in test_transitions:
    trans_narrative = nlg.generate_transition_narrative(transition["transition"])
    print(f"  • {trans_narrative} (occurred {transition['count']} times)")

print("\n📈 EXECUTIVE SUMMARY:")
print("-" * 70)
summary = nlg.generate_executive_summary(
    total_logs=1250,
    severity={"ERROR": 87, "WARNING": 156, "INFO": 1007},
    top_keywords=test_keywords,
    cluster_count=5
)
print(summary)

print("\n🎯 BEHAVIOR NARRATIVE:")
print("-" * 70)
behavior = nlg.generate_behavior_narrative(test_keywords, test_transitions)
print(behavior)

print("\n" + "=" * 70)
print("✅ NLG Test Complete!")
print("=" * 70)
