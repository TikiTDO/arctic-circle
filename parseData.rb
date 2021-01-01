require "json"
require "csv"

def do_thing
  a = JSON.parse(File.read("a.json"))

  levels = {}
  fields = {}
  a.each do |record|
    recursion_level = record["recursionLevel"]
    levels[recursion_level] ||= {}

    record["result"].each do |result|
      key = result.keys.first.gsub(/ for \d+/, "")
      levels[recursion_level][key] = result.values.first[/\d+/].to_i
      fields[key] = true
    end
  end

  ordered_fields = fields.keys

  CSV.generate do |csv|
    csv << ["Run Number", *ordered_fields]
    levels.each do |level, results|
      csv << [level, *ordered_fields.map { |field| results[field] }]
    end
  end
end
puts do_thing
