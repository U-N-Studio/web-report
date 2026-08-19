import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # 试经典视频 BV1xx411c7mD (aid=2)
        for oid in [2, 3, 170001]:
            for type_val in [1, 2, 33]:
                resp = await client.get(
                    "https://api.bilibili.com/x/v2/reply",
                    params={"type": type_val, "oid": oid, "pn": 1, "ps": 5},
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
                )
                d = resp.json()
                replies = d.get("data", {}).get("replies", []) or []
                if replies:
                    print(f"SUCCESS: oid={oid}, type={type_val}, replies={len(replies)}")
                    print(f"  Comment: {replies[0]['content']['message'][:80]}")
                    return
                else:
                    print(f"  oid={oid}, type={type_val}: code={d.get('code')}, msg={d.get('message')}, replies=0")

asyncio.run(test())
