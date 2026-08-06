/**
 * Adds the message keys introduced by the Trash and My Account features to
 * every locale file, keeping key order stable.
 *
 * Run with: npx tsx scripts/add-messages.ts
 *
 * Kept in the repo so the next person adding a namespace has a worked example
 * of updating all six catalogs at once instead of hand-editing them.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Catalog = Record<string, Record<string, string>>;

const ADDITIONS: Record<string, Catalog> = {
  en: {
    nav: { trash: 'Trash', account: 'My Account' },
    trash: {
      title: 'Trash',
      subtitle: 'Jobs that were deleted. Nothing is gone until you say so.',
      explainer:
        'When someone deletes a job it comes here instead of disappearing. Bring it back with one tap, or remove it for good.',
      empty: 'The trash is empty.',
      restore: 'Bring it back',
      restored: 'The job was brought back.',
      purge: 'Remove for good',
      purged: 'The job was removed for good.',
      purgeTitle: 'Remove this job for good?',
      purgeBody:
        'Job {number} for {customer} will be gone forever. This one really cannot be undone.',
      purgeConfirm: 'Yes, remove it forever',
      deletedBy: 'Deleted by {who} on {when}',
      restoreHint: 'Bringing a job back puts it into your lists and totals again.',
    },
    account: {
      title: 'My Account',
      subtitle: 'Your details and your password.',
      changePassword: 'Change my password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      passwordChanged: 'Your password was changed.',
      wrongCurrentPassword: 'That is not your current password.',
      sameAsOld: 'Please pick a different password from the one you have now.',
      otherDevicesNote:
        'Changing your password signs you out on every other phone or computer.',
      mustChangeTitle: 'Please set your own password first',
      mustChangeBody:
        'Somebody else chose the password you are using. Pick one only you know, then you can carry on.',
    },
  },
  fil: {
    nav: { trash: 'Basurahan', account: 'Aking Account' },
    trash: {
      title: 'Basurahan',
      subtitle: 'Mga trabahong binura. Wala pong tuluyang nawawala hangga’t hindi ninyo sinabi.',
      explainer:
        'Kapag may nagbura ng trabaho, dito po ito napupunta — hindi basta nawawala. Isang pindot lang para ibalik, o tuluyang alisin.',
      empty: 'Walang laman ang basurahan.',
      restore: 'Ibalik',
      restored: 'Naibalik na ang trabaho.',
      purge: 'Tuluyang alisin',
      purged: 'Tuluyan nang naalis ang trabaho.',
      purgeTitle: 'Tuluyang alisin ang trabahong ito?',
      purgeBody:
        'Ang trabaho {number} para kay {customer} ay tuluyang mawawala. Ito po talaga ay hindi na maibabalik.',
      purgeConfirm: 'Oo, tuluyang alisin',
      deletedBy: 'Binura ni {who} noong {when}',
      restoreHint: 'Kapag ibinalik, babalik din po ito sa inyong listahan at kabuuan.',
    },
    account: {
      title: 'Aking Account',
      subtitle: 'Ang inyong detalye at password.',
      changePassword: 'Palitan ang aking password',
      currentPassword: 'Kasalukuyang password',
      newPassword: 'Bagong password',
      passwordChanged: 'Napalitan na ang inyong password.',
      wrongCurrentPassword: 'Hindi po iyan ang kasalukuyang password ninyo.',
      sameAsOld: 'Pumili po ng ibang password, hindi iyong ginagamit ninyo ngayon.',
      otherDevicesNote:
        'Kapag pinalitan ninyo ang password, mala-log out kayo sa lahat ng ibang cellphone o computer.',
      mustChangeTitle: 'Pakigawa po muna ng sarili ninyong password',
      mustChangeBody:
        'Iba po ang pumili ng password na ginagamit ninyo. Pumili po ng alam ninyo lang, tapos puwede na kayong magpatuloy.',
    },
  },
  es: {
    nav: { trash: 'Papelera', account: 'Mi cuenta' },
    trash: {
      title: 'Papelera',
      subtitle: 'Trabajos eliminados. Nada desaparece hasta que usted lo diga.',
      explainer:
        'Cuando alguien elimina un trabajo, viene aquí en vez de desaparecer. Recupérelo con un toque, o bórrelo definitivamente.',
      empty: 'La papelera está vacía.',
      restore: 'Recuperar',
      restored: 'El trabajo fue recuperado.',
      purge: 'Borrar definitivamente',
      purged: 'El trabajo se borró definitivamente.',
      purgeTitle: '¿Borrar este trabajo definitivamente?',
      purgeBody:
        'El trabajo {number} de {customer} desaparecerá para siempre. Esto sí que no se puede deshacer.',
      purgeConfirm: 'Sí, borrar para siempre',
      deletedBy: 'Eliminado por {who} el {when}',
      restoreHint: 'Al recuperarlo vuelve a sus listas y a sus totales.',
    },
    account: {
      title: 'Mi cuenta',
      subtitle: 'Sus datos y su contraseña.',
      changePassword: 'Cambiar mi contraseña',
      currentPassword: 'Contraseña actual',
      newPassword: 'Contraseña nueva',
      passwordChanged: 'Su contraseña fue cambiada.',
      wrongCurrentPassword: 'Esa no es su contraseña actual.',
      sameAsOld: 'Elija una contraseña distinta de la que tiene ahora.',
      otherDevicesNote:
        'Cambiar la contraseña cierra su sesión en todos los demás dispositivos.',
      mustChangeTitle: 'Primero elija su propia contraseña',
      mustChangeBody:
        'Otra persona eligió la contraseña que usa. Elija una que solo usted conozca y podrá continuar.',
    },
  },
  ja: {
    nav: { trash: 'ゴミ箱', account: 'マイアカウント' },
    trash: {
      title: 'ゴミ箱',
      subtitle: '削除した作業です。あなたが決めるまで何も消えません。',
      explainer:
        '作業を削除すると、消えるのではなくここに入ります。ワンタップで戻せますし、完全に削除もできます。',
      empty: 'ゴミ箱は空です。',
      restore: '元に戻す',
      restored: '作業を元に戻しました。',
      purge: '完全に削除',
      purged: '作業を完全に削除しました。',
      purgeTitle: 'この作業を完全に削除しますか？',
      purgeBody: '{customer}様の作業 {number} は永久に消えます。これは本当に元に戻せません。',
      purgeConfirm: 'はい、完全に削除します',
      deletedBy: '{when} に {who} が削除',
      restoreHint: '元に戻すと、一覧と合計にも再び表示されます。',
    },
    account: {
      title: 'マイアカウント',
      subtitle: 'ご自身の情報とパスワードです。',
      changePassword: 'パスワードを変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      passwordChanged: 'パスワードを変更しました。',
      wrongCurrentPassword: '現在のパスワードが違います。',
      sameAsOld: '今お使いのものとは違うパスワードを選んでください。',
      otherDevicesNote: 'パスワードを変更すると、他のすべての端末からログアウトされます。',
      mustChangeTitle: 'まずご自身のパスワードを設定してください',
      mustChangeBody:
        '今のパスワードは別の人が決めたものです。ご自身だけが知るものに変えると、続けられます。',
    },
  },
  ko: {
    nav: { trash: '휴지통', account: '내 계정' },
    trash: {
      title: '휴지통',
      subtitle: '삭제한 작업입니다. 직접 정하기 전까지는 사라지지 않습니다.',
      explainer:
        '작업을 삭제하면 사라지지 않고 여기로 옵니다. 한 번 눌러 되돌리거나, 완전히 지울 수 있습니다.',
      empty: '휴지통이 비었습니다.',
      restore: '되돌리기',
      restored: '작업을 되돌렸습니다.',
      purge: '완전히 삭제',
      purged: '작업을 완전히 삭제했습니다.',
      purgeTitle: '이 작업을 완전히 삭제할까요?',
      purgeBody: '{customer} 고객의 작업 {number}이(가) 영원히 사라집니다. 이것은 정말 되돌릴 수 없습니다.',
      purgeConfirm: '예, 완전히 삭제합니다',
      deletedBy: '{when}에 {who}이(가) 삭제',
      restoreHint: '되돌리면 목록과 합계에 다시 나타납니다.',
    },
    account: {
      title: '내 계정',
      subtitle: '내 정보와 비밀번호입니다.',
      changePassword: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      passwordChanged: '비밀번호를 변경했습니다.',
      wrongCurrentPassword: '현재 비밀번호가 아닙니다.',
      sameAsOld: '지금 쓰는 것과 다른 비밀번호를 골라 주세요.',
      otherDevicesNote: '비밀번호를 바꾸면 다른 모든 기기에서 로그아웃됩니다.',
      mustChangeTitle: '먼저 본인 비밀번호를 정해 주세요',
      mustChangeBody:
        '지금 쓰는 비밀번호는 다른 사람이 정한 것입니다. 본인만 아는 것으로 바꾸면 계속할 수 있습니다.',
    },
  },
  zh: {
    nav: { trash: '回收站', account: '我的账户' },
    trash: {
      title: '回收站',
      subtitle: '已删除的工单。在您决定之前，什么都不会消失。',
      explainer: '删除工单后它会来到这里，而不是直接消失。点一下就能恢复，也可以彻底删除。',
      empty: '回收站是空的。',
      restore: '恢复',
      restored: '工单已恢复。',
      purge: '彻底删除',
      purged: '工单已彻底删除。',
      purgeTitle: '要彻底删除这张工单吗？',
      purgeBody: '{customer} 的工单 {number} 将永远消失。这一步真的无法撤销。',
      purgeConfirm: '是，永久删除',
      deletedBy: '{who} 于 {when} 删除',
      restoreHint: '恢复后它会重新出现在您的列表和合计里。',
    },
    account: {
      title: '我的账户',
      subtitle: '您的资料和密码。',
      changePassword: '修改我的密码',
      currentPassword: '当前密码',
      newPassword: '新密码',
      passwordChanged: '密码已修改。',
      wrongCurrentPassword: '这不是您当前的密码。',
      sameAsOld: '请选择一个和现在不同的密码。',
      otherDevicesNote: '修改密码后，其他所有设备都会退出登录。',
      mustChangeTitle: '请先设置您自己的密码',
      mustChangeBody: '您现在用的密码是别人设置的。改成只有您知道的密码后就可以继续了。',
    },
  },
};

// New audit-log labels, added to the existing `audit` namespace.
const AUDIT: Record<string, Record<string, string>> = {
  en: {
    action_RESTORE_JOB: 'Brought a job back',
    action_PURGE_JOB: 'Removed a job for good',
    action_CHANGE_OWN_PASSWORD: 'Changed own password',
  },
  fil: {
    action_RESTORE_JOB: 'Ibinalik ang trabaho',
    action_PURGE_JOB: 'Tuluyang inalis ang trabaho',
    action_CHANGE_OWN_PASSWORD: 'Pinalitan ang sariling password',
  },
  es: {
    action_RESTORE_JOB: 'Recuperó un trabajo',
    action_PURGE_JOB: 'Borró un trabajo definitivamente',
    action_CHANGE_OWN_PASSWORD: 'Cambió su contraseña',
  },
  ja: {
    action_RESTORE_JOB: '作業を元に戻した',
    action_PURGE_JOB: '作業を完全に削除した',
    action_CHANGE_OWN_PASSWORD: '自分のパスワードを変更',
  },
  ko: {
    action_RESTORE_JOB: '작업을 되돌림',
    action_PURGE_JOB: '작업을 완전히 삭제',
    action_CHANGE_OWN_PASSWORD: '본인 비밀번호 변경',
  },
  zh: {
    action_RESTORE_JOB: '恢复了工单',
    action_PURGE_JOB: '彻底删除了工单',
    action_CHANGE_OWN_PASSWORD: '修改了自己的密码',
  },
};

for (const [locale, namespaces] of Object.entries(ADDITIONS)) {
  const file = join(process.cwd(), 'messages', `${locale}.json`);
  const catalog = JSON.parse(readFileSync(file, 'utf8')) as Catalog;

  for (const [ns, entries] of Object.entries(namespaces)) {
    catalog[ns] = { ...(catalog[ns] ?? {}), ...entries };
  }
  catalog.audit = { ...(catalog.audit ?? {}), ...AUDIT[locale] };

  writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`updated messages/${locale}.json`);
}
