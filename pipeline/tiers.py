"""Result tiers. A rating is PvPoke-style: 1000 = flawless win, 500 = tie, 0 = flawless loss.
W  = clear win   (rating >= 500 + margin)
CW = close win   (501 .. 500 + margin - 1)
T  = tie         (exactly 500)
CL = close loss  (500 - margin + 1 .. 499)
L  = clear loss  (rating <= 500 - margin)"""
MARGIN=75
def tier(r,m=MARGIN):
    if r>=500+m: return 'W'
    if r>500: return 'CW'
    if r==500: return 'T'
    if r>500-m: return 'CL'
    return 'L'
