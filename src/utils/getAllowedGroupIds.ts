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

  if (profile.role === 'senior') {
    const groupId = profile.group_id
    const groupType = getGroupType(profile.groups)

    if (groupType === 'state') {
      const { data: childGroups } = await supabase
        .from('groups')
        .select('id')
        .eq('parent_group_id', groupId)
      return [groupId as string, ...(childGroups?.map(g => g.id) || [])]
    } else if (groupId) {
      return [groupId]
    }
    return []
  }

  if (profile.role === 'junior') {
    return profile.group_id ? [profile.group_id] : []
  }

  return []
}
