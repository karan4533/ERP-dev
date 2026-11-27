#!/usr/bin/env bash
# Launch a one-off Fargate task (same VPC/task def as qmis-backend) to run the remap script.
set -euo pipefail

MODE="${REMAP_MODE:-write}"
ECS_CLUSTER="${ECS_CLUSTER:-qmis-erp}"
ECS_SERVICE="${ECS_SERVICE:-qmis-backend}"

echo "mode=$MODE"

python3 - <<'PY'
import base64, json, os
from pathlib import Path

src = Path("backend/scripts/_live_fileroom_cctv_remap.py").read_bytes()
encoded = base64.b64encode(src).decode()
cmd = "import base64; exec(base64.b64decode('" + encoded + "').decode())"
env = []
if os.environ.get("REMAP_MODE") == "dry-run":
    env.append({"name": "REMAP_DRY_RUN", "value": "1"})
Path("/tmp/overrides.json").write_text(
    json.dumps(
        {
            "containerOverrides": [
                {
                    "name": "backend",
                    "command": ["python", "-c", cmd],
                    "environment": env,
                }
            ]
        }
    ),
    encoding="utf-8",
)
print("override_bytes", len(encoded), "env", env)
PY

SVC=$(aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE" \
  --query 'services[0]' --output json)
TASK_DEF=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["taskDefinition"])' <<<"$SVC")
AWSVPC=$(python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["networkConfiguration"]["awsvpcConfiguration"]))' <<<"$SVC")

echo "Using taskDefinition=$TASK_DEF"

RUN=$(aws ecs run-task \
  --cluster "$ECS_CLUSTER" \
  --task-definition "$TASK_DEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration=$AWSVPC" \
  --overrides "file:///tmp/overrides.json" \
  --query 'tasks[0].taskArn' --output text)

echo "Started $RUN"
if [ -z "$RUN" ] || [ "$RUN" = "None" ]; then
  echo "run-task did not return a task ARN"
  exit 1
fi

aws ecs wait tasks-stopped --cluster "$ECS_CLUSTER" --tasks "$RUN"
aws ecs describe-tasks --cluster "$ECS_CLUSTER" --tasks "$RUN" --output json > "/tmp/task-${MODE}.json"

python3 - <<PY
import json, sys
d = json.load(open("/tmp/task-${MODE}.json"))
t = d["tasks"][0]
c = t["containers"][0]
print("exitCode=", c.get("exitCode"))
print("reason=", c.get("reason"))
print("stoppedReason=", t.get("stoppedReason"))
print("lastStatus=", t.get("lastStatus"))
sys.exit(0 if c.get("exitCode") == 0 else 1)
PY
