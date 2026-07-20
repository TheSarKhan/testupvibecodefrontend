# DNS for AI Discovery (DNS-AID) for testup.az

Agent discovery over DNS: an agent looks up `_<service>._agents.<domain>` and
gets a ServiceMode SVCB/HTTPS record pointing at the entry point, instead of
guessing URLs. Draft:
<https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/> · SVCB:
[RFC 9460](https://www.rfc-editor.org/rfc/rfc9460).

**These records cannot be created from this repo — they are published in the
Cloudflare dashboard for the testup.az zone** (nameservers: `daniella.ns.cloudflare.com`,
`nitin.ns.cloudflare.com`).

## 1. Record to publish

testup.az has one agent entry point today: the HTTPS discovery documents at the
site root (`/.well-known/api-catalog`, `/.well-known/agent-skills/index.json`,
`/auth.md`). That is an `_index` record:

```dns
_index._agents.testup.az. 3600 IN HTTPS 1 testup.az. alpn="h2,http/1.1" port=443 mandatory=alpn
```

In the Cloudflare dashboard → **DNS → Records → Add record**:

| Field | Value |
| --- | --- |
| Type | `HTTPS` |
| Name | `_index._agents` |
| TTL | `1 hour` |
| Priority | `1` |
| Target | `testup.az` |
| Value | `alpn="h2,http/1.1" port=443 mandatory=alpn` |
| Proxy status | DNS only (grey cloud) |

Priority `1` (not `0`) is what makes it a **ServiceMode** record; a `0` priority
would be AliasMode and would not carry the parameters.

### Optional: point at the catalog explicitly

The draft's `endpoint` parameter has no registered SvcParamKey yet, so it must be
written in the private-use range as `keyNNNNN` if you want it:

```dns
_index._agents.testup.az. 3600 IN HTTPS 1 testup.az. alpn="h2,http/1.1" port=443 key65280="/.well-known/api-catalog" mandatory=alpn
```

Add this only once the draft settles on a key number — an unknown key is ignored
by clients, so it is harmless but also currently useless.

### Not applicable yet

- `_a2a._agents.testup.az` — no Agent2Agent endpoint exists. Do not publish.
- `_mcp._agents.testup.az` — no MCP server exists. Do not publish.

Publishing a record for a service that does not answer is worse than publishing
nothing: agents will connect, fail, and may back off from the domain.

## 2. Turn on DNSSEC

Checked 2026-07-19: testup.az serves DNSKEY records (Cloudflare signs the zone)
but **there is no DS record at the `.az` parent**, so validating resolvers treat
the zone as unsigned. The discovery records are therefore not authenticated.

1. Cloudflare dashboard → **DNS → Settings → DNSSEC → Enable DNSSEC**.
2. Copy the DS record Cloudflare shows (key tag, algorithm 13, digest type 2, digest).
3. Give it to the `.az` registrar for the testup.az delegation.
4. Verify — the first command must return a DS record, the second must report
   `flags: … ad`:

```sh
dig +short DS testup.az @1.1.1.1
dig +dnssec testup.az @1.1.1.1 | grep flags
```

Propagation to the parent zone can take a day or two.

## 3. Verify the record

```sh
dig +short HTTPS _index._agents.testup.az @1.1.1.1
# expect: 1 testup.az. alpn="h2,http/1.1" port=443 mandatory=alpn
```

Note that a wildcard record in the zone can mask a missing `_agents` record with
an unrelated answer, so check the record type in the output, not just that
something came back.
