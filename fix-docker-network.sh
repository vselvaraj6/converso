#!/bin/bash
# Fix Docker container-to-container networking on custom bridges
# This is needed due to a Docker bug where DOCKER-FORWARD only accepts
# traffic from docker0, not custom network bridges.

NETWORK_ID=$(docker network inspect converso_default --format '{{.Id}}' 2>/dev/null | cut -c1-12)
if [ -z "$NETWORK_ID" ]; then
  echo "converso_default network not found, skipping."
  exit 0
fi

BRIDGE="br-${NETWORK_ID}"
echo "Applying iptables fix for bridge: $BRIDGE"

# Remove existing rules (idempotent)
iptables -D DOCKER-USER -i "$BRIDGE" -o "$BRIDGE" -j ACCEPT 2>/dev/null || true
iptables -D DOCKER-USER -i "$BRIDGE" -j ACCEPT 2>/dev/null || true
iptables -D DOCKER-USER -o "$BRIDGE" -j ACCEPT 2>/dev/null || true

# Add rules
iptables -I DOCKER-USER -i "$BRIDGE" -o "$BRIDGE" -j ACCEPT
iptables -I DOCKER-USER -i "$BRIDGE" -j ACCEPT
iptables -I DOCKER-USER -o "$BRIDGE" -j ACCEPT

echo "Done."
