#!/bin/bash
# ONE-SHOT EC2 fix - run inside lakshmi-millets-frontend. No uploads needed.
# Assumes EC2 files are the STALE versions from your build log.
set -x
# 1. app.module line43: literal `r`n -> real newlines (fixes NG1010/TS1005 + all NG8001/NG8002/NG8004 cascade)
# NOTE: uses \x60 (=backtick) so chat copy-paste cannot break it
perl -i -pe 's/\x60r\x60n/\n/g' src/app/app.module.ts
sed -n '40,50p' src/app/app.module.ts
# 2. delivery.service: file has 19 lines with extra trailing } -> keep first 18
wc -l src/app/core/services/delivery.service.ts
head -n 18 src/app/core/services/delivery.service.ts > /tmp/ds.ts && cat /tmp/ds.ts > src/app/core/services/delivery.service.ts
tail -6 src/app/core/services/delivery.service.ts
# 3. order.service: deliveryLocationId required -> optional (fixes TS2322 at checkout:173)
perl -i -pe 's/deliveryLocationId:\s*string;/deliveryLocationId?: string;/' src/app/core/services/order.service.ts
grep -n deliveryLocationId src/app/core/services/order.service.ts
# 4. checkout.component.ts stale lines (from your log):
#    L75  def.id  -> tolerant
#    L120 find(a => a.isDefault)?.id ... -> tolerant
#    L152 a.id === -> tolerant
perl -i -pe 's/this\.selectedAddressId = def\.id;/this.selectedAddressId = (def as any).id || (def as any)._id || "";/g' src/app/components/checkout/checkout.component.ts
perl -i -pe 's/this\.savedAddresses\.find\(a => a\.isDefault\)\?\.id \|\| this\.savedAddresses\[0\]\?\.id \|\| '"''"'/this.savedAddresses.find(a => a.isDefault)?.id || (this.savedAddresses.find(a => a.isDefault) as any)?._id || this.savedAddresses[0]?.id || (this.savedAddresses[0] as any)?._id || '"''"'/g' src/app/components/checkout/checkout.component.ts
perl -i -pe 's/a\.id === this\.selectedAddressId/((a as any).id || (a as any)._id) === this.selectedAddressId/g' src/app/components/checkout/checkout.component.ts
grep -n 'selectedAddressId =\|(a as any)' src/app/components/checkout/checkout.component.ts | head -20
# 5. navbar.component.html:115 currentUser.name.split -> null-safe (fixes TS2531)
perl -i -pe 's/\{\{\s*currentUser\.name\.split/{{ (currentUser?.name || "").split/g' src/app/components/navbar/navbar.component.html
grep -n 'hello' src/app/components/navbar/navbar.component.html
# 6. home.component.html:45 routerLink on div -> click nav (fixes NG8002 routerLink on div)
perl -i -pe "s/\[routerLink\]=\"\['\/product', p\.slug\]\"/\(click\)=\"goToProduct(p.slug)\"/g" src/app/components/home/home.component.html
grep -n 'goToProduct\|routerLink' src/app/components/home/home.component.html | head -10
echo 'ADD to home.component.ts if missing: goToProduct(slug: string) { this.router.navigate(["/product", slug]); }'
grep -n 'goToProduct' src/app/components/home/home.component.ts || echo 'MISSING - add it manually'
# 7. build
rm -rf dist
npx ng build --configuration production

