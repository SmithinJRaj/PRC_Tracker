import { SupabaseClient } from '@supabase/supabase-js'

type Profile = {
  role: string
  group_id: string | null
  groups?: { type?: string } | { type?: string }[] | null
}

function getGroupType(groups: Profile['groups']): string | undefined {
  if (!groups) return undefined
  return Array.isArray(groups) ? groups[0]?.type : groups.type
}

export async function getAllowedGroupIds(
  supabase: SupabaseClient,
  profile: Profile
): Promise<string[] | null> {
  if (profile.role === 'admin') return null // null = unrestricted

  if (profile.role === 'senior' || profile.role === 'junior') {
    const groupId = profile.group_id
    if (!groupId) return []

    const groupType = getGroupType(profile.groups)

    if (groupType === 'state') {
      const { data: childGroups } = await supabase
        .from('groups')
        .select('id')
        .eq('parent_group_id', groupId)
      return [groupId, ...(childGroups?.map(g => g.id) || [])]
    }

    return [groupId]
  }

  return []
}
