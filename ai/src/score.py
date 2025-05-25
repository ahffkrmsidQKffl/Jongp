# inference_server.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import math
import pandas as pd
import numpy as np
import joblib
import warnings, logging
warnings.filterwarnings("ignore")
logging.getLogger("xgboost").setLevel(logging.ERROR)

# 시간별 주차현황 데이터 로드·전처리 (학습과 동일)
df = pd.read_csv("서울시설공단_공영주차장_시간별_주차현황_20240331.csv", encoding="cp949")
df["시간대"] = pd.to_datetime(df["시간대"], format="%Y-%m-%d %H", errors='coerce')
df.dropna(subset=["시간대"], inplace=True)
df["시간"] = df["시간대"].dt.hour
df["요일"] = df["시간대"].dt.dayofweek
df["주차장명"] = df["주차장명"].str.strip().str.lower()
# df["혼잡도(%)"] = ((df["입차대수"] - df["출차대수"]) / df["주차면수"] * 100).clip(0,100)
# 시간 순 정렬 및 누적 합
df['누적입차'] = df.groupby('주차장명')['입차대수'].cumsum()
df['누적출차'] = df.groupby('주차장명')['출차대수'].cumsum()

# lag features 생성
lags = [(7*24, "지난주_혼잡도"), (14*24, "지지난주_혼잡도"), (21*24, "지지지난주_혼잡도")]
for lag, col in lags:
    df[col] = df.groupby(["주차장명","요일","시간"])["혼잡도(%)"].shift(lag)
    df[col] = df[col].ffill()
    df[col].fillna(df["혼잡도(%)"], inplace=True)
# 불필요 컬럼 및 타입
df.drop(columns=["시간대"], inplace=True)
for c in df.select_dtypes(["int64","float64"]): df[c] = df[c].astype("float32")

# 전처리기·모델 
scaler      = joblib.load("scaler.joblib")
ordinal     = joblib.load("ordinal.joblib")
fit_columns = joblib.load("fit_columns.joblib")
model       = joblib.load("model.joblib")

# 정적 데이터: 두 개 로드 및 요금 예외 처리
df_static_a = pd.read_csv("서울시_공영주차장_최종.csv", encoding="cp949")
df_static_b = pd.read_csv("전처리_완료_실시간_주차장.csv", encoding="utf-8")
for df_s in [df_static_a, df_static_b]:
    df_s["주차장명"] = df_s["주차장명"].str.strip().str.lower()
    df_s["기본 주차 요금"].fillna(df_s["기본 주차 요금"].mean(), inplace=True)
    df_s["추가 단위 요금"].fillna(df_s["추가 단위 요금"].mean(), inplace=True)

# 헬퍼 함수 정의
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1,phi2 = map(math.radians, (lat1,lat2))
    dphi = math.radians(lat2-lat1)
    dlambda = math.radians(lon2-lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def calculate_fee(row, duration):
    base = row.get("기본 주차 요금",0) or 0
    t0   = row.get("기본 주차 시간(분 단위)",0) or 0
    extra= row.get("추가 단위 요금",0) or 0
    dt   = row.get("추가 단위 시간(분 단위)",5) or 5
    cap  = row.get("일 최대 요금", None)

    if duration <= t0:
        return base

    over  = duration - t0
    units = math.ceil(over / dt)
    total = base + units * extra

    # 일최대요금이 명시되었고, 0보다 크다면 제한 적용
    if cap is not None and not pd.isna(cap) and cap > 0:
        return min(total, cap)

    # cap이 0인데 base/extra 둘 중 하나라도 존재 → 무시
    if cap == 0 and (base > 0 or extra > 0):
        return total

    return total  # default

def predict_congestion(name, weekday, hour):
    wd     = (weekday - 1) % 7
    filt   = df[(df["주차장명"]==name.lower()) & (df["요일"]==wd) & (df["시간"]==hour)]
    if filt.empty:
        filt = df[df["주차장명"]==name.lower()]
    avg = filt[["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"]].mean()
    inp = pd.DataFrame([[avg[col] for col in ["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"]]],
                       columns=["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"])
    inp["시간"] = hour; inp["요일"] = wd
    inp = inp.reindex(columns=fit_columns)
    inp[["요일"]] = ordinal.transform(inp[["요일"]])
    nums = [c for c in fit_columns if c != "요일"]
    inp[nums] = scaler.transform(inp[nums])
    return float(model.predict(inp)[0])

def recommend(candidates, duration=120, lat0=None, lon0=None):
    raw=[]

    # 실시간 대상 주차장 이름 목록
    realtime_names = set(df_static_b["주차장명"].str.strip().str.lower().unique())

    for c in candidates:
        name,rev,wd,hr = c["p_id"], c.get("review",0), c.get("weekday",1), c.get("hour",0)
        print(f"[INFO] 후보 처리 시작: {name} (weekday={wd}, hour={hr})", file=sys.stderr)

        # 혼잡도 분기 기준 수정... pid가 주차장 이름이었을 줄이야..... 아참 api는 모든 주차장의 혼잡도 불러왔지...
        # + 정적 정보 분기도 한 번에 진행
        name_normalized = name.strip().lower()
        is_realtime = "congestion" in c and name_normalized in realtime_names

        if is_realtime:
            cong = c["congestion"]
            print(f"[DEBUG] 혼잡도 예측 방식: 실시간 입력값 사용 → {cong:.2f}", file=sys.stderr)
            row = df_static_b[df_static_b["주차장명"] == name_normalized]
            print(f"[DEBUG] 사용된 정적 파일: df_static_b", file=sys.stderr)
        else:
            cong = predict_congestion(name, wd, hr)
            print(f"[DEBUG] 혼잡도 예측 방식: AI 예측 → {cong:.2f}", file=sys.stderr)
            row = df_static_a[df_static_a["주차장명"] == name_normalized]
            print(f"[DEBUG] 사용된 정적 파일: df_static_a", file=sys.stderr)

        cs = np.clip(100-cong, 0, 100)
        print(f"[DEBUG] 혼잡도 점수 (가용도): {cs:.2f}", file=sys.stderr)

        if not row.empty and lat0 is not None and lon0 is not None:
            lat,lon = row[["위도","경도"]].iloc[0]
            dist    = haversine(lat0,lon0,lat,lon)
        else:
            dist    = 0
        print(f"[DEBUG] 거리 계산 결과: {dist:.3f} km", file=sys.stderr)

        fee    = calculate_fee(row.iloc[0] if not row.empty else {}, duration)
        print(f"[DEBUG] 계산된 주차요금 (duration={duration}분): {fee:.2f}원", file=sys.stderr)

        rs     = np.clip(rev,0,5)/5*100
        print(f"[DEBUG] 리뷰 점수 변환: {rev:.1f} → {rs:.2f} (0~100 scale)", file=sys.stderr)

        raw.append({"p_id":name,"cs":cs,"dist":dist,"fee":fee,"rs":rs})

    fees  = [r["fee"] for r in raw]; dists=[r["dist"] for r in raw]
    minf,maxf = (min(fees),max(fees)) if fees else (0,1)
    mind,maxd = (min(dists),max(dists)) if dists else (0,1)
    scenarios={"혼잡도우선":{"w_c":0.8,"w_d":0.1,"w_f":0.05,"w_r":0.05},
               "거리우선":  {"w_c":0.5,"w_d":0.3,"w_f":0.1, "w_r":0.1},
               "요금우선":  {"w_c":0.5,"w_d":0.1,"w_f":0.3, "w_r":0.1},
               "리뷰우선":  {"w_c":0.5,"w_d":0.1,"w_f":0.1, "w_r":0.3}}
    out={}
    for key,w in scenarios.items():
        temp=[]
        for r in raw:
            fs =(maxf - r["fee"]) / (maxf-minf)*100 if maxf>minf else 0
            ds =(maxd - r["dist"]) / (maxd-mind)*100 if maxd>mind else 0
            sc = w["w_c"]*r["cs"] + w["w_d"]*ds + w["w_f"]*fs + w["w_r"]*r["rs"]
            temp.append({"p_id":r["p_id"],"score":sc})
            print(f"[SCORE] {key} - {r['p_id']} → 혼잡도={r['cs']:.1f}, 거리={ds:.1f}, 요금={fs:.1f}, 리뷰={r['rs']:.1f} → 종합={sc:.2f}", file=sys.stderr)
        out[key]=temp
    return out

# 출력 + JSON 리턴
def main():
    try: data=json.load(sys.stdin)
        #예시 데이터
    except: data={"candidates":[
        {"p_id":"복정역","review":4.2,"weekday":3,"hour":14},
        {"p_id":"볕우물","review":3.5,"weekday":3,"hour":14},
        {"p_id":"용산주차빌딩","review":4.9,"weekday":3,"hour":14}
    ],"parking_duration":120,"base_lat":37.450,"base_lon":127.129}
    res=recommend(data["candidates"],data.get("parking_duration",120),data.get("base_lat"),data.get("base_lon"))

    json.dump([{"p_id":i["p_id"],"주차장명": i["p_id"], **{k:round(next(x["score"] for x in res[k] if x["p_id"]==i["p_id"]),2) for k in res}} for i in res["혼잡도우선"]], sys.stdout, ensure_ascii=False, indent=2)

if __name__=="__main__": main()
